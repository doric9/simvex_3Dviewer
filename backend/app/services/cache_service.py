"""Semantic FAQ Cache Service for instant answers to common questions."""

import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI

from app.config import get_settings
from app.models.database import QACache


class CacheService:
    """Service for managing semantic Q&A cache."""

    # Minimum similarity threshold (0-1, higher = more strict matching)
    SIMILARITY_THRESHOLD = 0.85
    # Maximum number of cache entries per machinery
    MAX_CACHE_SIZE = 100

    def __init__(self, db: AsyncSession):
        self.db = db
        settings = get_settings()
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.embedding_model = "text-embedding-3-small"

    async def get_embedding(self, text: str) -> list[float]:
        """Generate embedding for a text using OpenAI's embedding model."""
        response = await self.client.embeddings.create(
            model=self.embedding_model,
            input=text
        )
        return response.data[0].embedding

    def cosine_similarity(self, vec1: list[float], vec2: list[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        a = np.array(vec1)
        b = np.array(vec2)
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

    async def find_cached_answer(
        self,
        machinery_id: str,
        question: str
    ) -> tuple[str | None, float]:
        """
        Find a semantically similar cached answer.

        Args:
            machinery_id: The machinery context
            question: The user's question

        Returns:
            Tuple of (cached_answer or None, similarity_score)
        """
        # Get question embedding
        question_embedding = await self.get_embedding(question)

        # Fetch all cached Q&A for this machinery
        result = await self.db.execute(
            select(QACache).where(QACache.machinery_id == machinery_id)
        )
        cached_entries = result.scalars().all()

        if not cached_entries:
            return None, 0.0

        # Find best match
        best_match = None
        best_similarity = 0.0

        for entry in cached_entries:
            similarity = self.cosine_similarity(question_embedding, entry.embedding)
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = entry

        # Return if above threshold
        if best_match and best_similarity >= self.SIMILARITY_THRESHOLD:
            # Update hit count
            best_match.hit_count += 1
            await self.db.commit()
            return best_match.answer, best_similarity

        return None, best_similarity

    async def cache_answer(
        self,
        machinery_id: str,
        question: str,
        answer: str
    ) -> None:
        """
        Cache a question-answer pair for future retrieval.

        Args:
            machinery_id: The machinery context
            question: The user's question
            answer: The AI's response
        """
        # Generate embedding for the question
        embedding = await self.get_embedding(question)

        # Check if we need to evict old entries
        await self._enforce_cache_limit(machinery_id)

        # Create new cache entry
        cache_entry = QACache(
            machinery_id=machinery_id,
            question=question,
            answer=answer,
            embedding=embedding,
        )
        self.db.add(cache_entry)
        await self.db.commit()

    async def _enforce_cache_limit(self, machinery_id: str) -> None:
        """Remove oldest/least used entries if cache is too large."""
        # Count entries for this machinery
        result = await self.db.execute(
            select(QACache).where(QACache.machinery_id == machinery_id)
        )
        entries = result.scalars().all()

        if len(entries) >= self.MAX_CACHE_SIZE:
            # Sort by hit_count (ascending) and last_used_at (ascending)
            # to find least valuable entries
            entries_sorted = sorted(
                entries,
                key=lambda e: (e.hit_count, e.last_used_at)
            )
            # Remove bottom 10%
            to_remove = entries_sorted[:max(1, len(entries) // 10)]
            for entry in to_remove:
                await self.db.delete(entry)
            await self.db.commit()

    async def update_quality_score(
        self,
        machinery_id: str,
        question: str,
        positive: bool
    ) -> None:
        """
        Update quality score based on user feedback.

        Args:
            machinery_id: The machinery context
            question: The question that received feedback
            positive: True for thumbs up, False for thumbs down
        """
        # Get embedding for question
        question_embedding = await self.get_embedding(question)

        # Find matching cached entry
        result = await self.db.execute(
            select(QACache).where(QACache.machinery_id == machinery_id)
        )
        cached_entries = result.scalars().all()

        for entry in cached_entries:
            similarity = self.cosine_similarity(question_embedding, entry.embedding)
            if similarity >= self.SIMILARITY_THRESHOLD:
                # Adjust quality score
                if positive:
                    entry.quality_score = min(2.0, entry.quality_score + 0.1)
                else:
                    entry.quality_score = max(0.1, entry.quality_score - 0.2)
                await self.db.commit()
                break

    async def get_cache_stats(self, machinery_id: str | None = None) -> dict:
        """Get cache statistics for monitoring."""
        if machinery_id:
            result = await self.db.execute(
                select(QACache).where(QACache.machinery_id == machinery_id)
            )
        else:
            result = await self.db.execute(select(QACache))

        entries = result.scalars().all()

        if not entries:
            return {
                "total_entries": 0,
                "total_hits": 0,
                "avg_quality_score": 0.0,
            }

        return {
            "total_entries": len(entries),
            "total_hits": sum(e.hit_count for e in entries),
            "avg_quality_score": sum(e.quality_score for e in entries) / len(entries),
        }
