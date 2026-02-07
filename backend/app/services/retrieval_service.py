"""RAG retrieval service for finding relevant knowledge chunks."""

import logging
import re
from dataclasses import dataclass

import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI

from app.config import get_settings
from app.models.database import KnowledgeChunk

logger = logging.getLogger(__name__)

# Korean Unicode range for language detection
_KOREAN_RE = re.compile(r'[\uac00-\ud7af\u3130-\u318f]')
# Tokenization: split on whitespace and punctuation
_TOKEN_SPLIT_RE = re.compile(r'[\s\.,;:!?\-\(\)\[\]{}\'\"]+')

SOURCE_TYPE_BOOSTS: dict[str, float] = {
    "machinery_theory": 1.15,
    "machinery_description": 1.10,
    "part_info": 1.10,
    "wikipedia": 1.00,
    "pdf_document": 1.05,
    "user_document": 0.95,
    "quiz_knowledge": 0.85,
}


@dataclass
class RetrievalResult:
    """A single retrieval result with metadata."""
    content: str
    source_name: str
    source_type: str
    section: str | None
    machinery_id: str | None
    relevance_score: float
    language: str


class RetrievalService:
    """Service for retrieving relevant knowledge chunks via semantic search."""

    SIMILARITY_THRESHOLD = 0.35  # Hybrid score threshold (after 0.7*cosine + 0.3*keyword)
    COSINE_FLOOR = 0.15  # Minimum cosine to even consider a chunk (noise filter)
    MAX_RESULTS = 5
    MAX_CONTEXT_CHARS = 2000
    EMBEDDING_MODEL = "text-embedding-3-small"

    def __init__(self, db: AsyncSession):
        self.db = db
        settings = get_settings()
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def _get_embedding(self, text: str) -> list[float]:
        """Generate embedding for query text."""
        response = await self.client.embeddings.create(
            model=self.EMBEDDING_MODEL,
            input=text,
        )
        return response.data[0].embedding

    @staticmethod
    def _cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        a = np.array(vec1)
        b = np.array(vec2)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    @staticmethod
    def _tokenize(text: str) -> set[str]:
        """Tokenize text into terms. Adds character bigrams for Korean words."""
        tokens: set[str] = set()
        for word in _TOKEN_SPLIT_RE.split(text.lower()):
            word = word.strip()
            if not word:
                continue
            tokens.add(word)
            # Add character bigrams for Korean words to handle compound terms
            if _KOREAN_RE.search(word) and len(word) >= 2:
                for i in range(len(word) - 1):
                    tokens.add(word[i : i + 2])
        return tokens

    @staticmethod
    def _keyword_score(query_tokens: set[str], chunk_text: str) -> float:
        """Proportion of query tokens found in chunk content (0.0–1.0)."""
        if not query_tokens:
            return 0.0
        chunk_lower = chunk_text.lower()
        found = sum(1 for t in query_tokens if t in chunk_lower)
        return found / len(query_tokens)

    @staticmethod
    def _detect_language(text: str) -> str:
        """Simple language detection: has Korean chars → 'ko', else 'en'."""
        return "ko" if _KOREAN_RE.search(text) else "en"

    @staticmethod
    def _rerank(
        scored: list[tuple["KnowledgeChunk", float]],
        query_lang: str,
    ) -> list[tuple["KnowledgeChunk", float]]:
        """Apply source-type boosts and language-match boost."""
        reranked = []
        for chunk, score in scored:
            boost = SOURCE_TYPE_BOOSTS.get(chunk.source_type, 1.0)
            if chunk.language == query_lang:
                boost *= 1.05
            reranked.append((chunk, score * boost))
        reranked.sort(key=lambda x: x[1], reverse=True)
        return reranked

    async def retrieve(
        self,
        query: str,
        machinery_id: str | None = None,
        part_name: str | None = None,
        top_k: int = 5,
        threshold: float | None = None,
    ) -> list[RetrievalResult]:
        """
        Retrieve the most relevant knowledge chunks for a query.

        Args:
            query: The search query
            machinery_id: Filter to specific machinery
            part_name: Filter to specific part
            top_k: Maximum number of results
            threshold: Minimum similarity threshold (default: self.SIMILARITY_THRESHOLD)

        Returns:
            List of RetrievalResult sorted by relevance
        """
        threshold = threshold if threshold is not None else self.SIMILARITY_THRESHOLD

        # Build filtered query
        stmt = select(KnowledgeChunk)
        if machinery_id:
            stmt = stmt.where(KnowledgeChunk.machinery_id == machinery_id)
        if part_name:
            stmt = stmt.where(KnowledgeChunk.part_name == part_name)

        result = await self.db.execute(stmt)
        chunks = result.scalars().all()

        if not chunks:
            return []

        # Get query embedding and tokenize query
        query_embedding = await self._get_embedding(query)
        query_tokens = self._tokenize(query)
        query_lang = self._detect_language(query)

        # Calculate hybrid scores (semantic + keyword)
        scored = []
        for chunk in chunks:
            cosine_sim = self._cosine_similarity(query_embedding, chunk.embedding)
            if cosine_sim < self.COSINE_FLOOR:
                continue
            kw_score = self._keyword_score(query_tokens, chunk.content)
            hybrid = 0.7 * cosine_sim + 0.3 * kw_score
            if hybrid >= threshold:
                scored.append((chunk, hybrid))

        # Re-rank with source-type and language boosts
        scored = self._rerank(scored, query_lang)

        # Return top-k
        results = []
        for chunk, score in scored[:top_k]:
            results.append(RetrievalResult(
                content=chunk.content,
                source_name=chunk.source_name,
                source_type=chunk.source_type,
                section=chunk.section,
                machinery_id=chunk.machinery_id,
                relevance_score=round(score, 4),
                language=chunk.language,
            ))

        return results

    async def retrieve_for_context(
        self,
        query: str,
        machinery_id: str | None = None,
        max_chars: int | None = None,
    ) -> tuple[str, list[RetrievalResult]]:
        """
        Retrieve knowledge and format it as context for LLM prompts.

        Args:
            query: The search query
            machinery_id: Filter to specific machinery
            max_chars: Maximum context length in characters

        Returns:
            Tuple of (formatted_context_string, retrieval_results)
        """
        max_chars = max_chars or self.MAX_CONTEXT_CHARS

        results = await self.retrieve(
            query=query,
            machinery_id=machinery_id,
            top_k=self.MAX_RESULTS,
        )

        if not results:
            return "", []

        # Format context with source attribution
        context_parts = []
        total_chars = 0

        for r in results:
            source_label = r.source_name
            if r.section and r.section not in ("wikipedia", "pdf"):
                source_label = f"{r.source_name} - {r.section}"

            entry = f"[출처: {source_label}]\n{r.content}"

            if total_chars + len(entry) > max_chars:
                break

            context_parts.append(entry)
            total_chars += len(entry)

        context_str = "\n\n".join(context_parts)
        return context_str, results

    async def search(
        self,
        query: str,
        machinery_id: str | None = None,
        top_k: int = 10,
    ) -> list[RetrievalResult]:
        """
        Search the knowledge base (broader search for student-facing search).

        Uses a lower threshold than retrieve() to return more results.
        """
        return await self.retrieve(
            query=query,
            machinery_id=machinery_id,
            top_k=top_k,
            threshold=0.2,  # Lower threshold for broader search
        )
