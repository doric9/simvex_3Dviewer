"""Knowledge ingestion service for chunking, embedding, and storing content."""

import logging
import re
from typing import Optional

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI

from app.config import get_settings
from app.models.database import KnowledgeChunk
from app.data.machinery import MACHINERY_DATA
from app.data.quiz_bank import QUIZ_DATA
from app.services.wikipedia_service import WikipediaService

logger = logging.getLogger(__name__)


class IngestionService:
    """Service for ingesting content into the knowledge base."""

    EMBEDDING_MODEL = "text-embedding-3-small"
    BATCH_SIZE = 100  # Max texts per embedding API call

    def __init__(self, db: AsyncSession):
        self.db = db
        settings = get_settings()
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def get_embedding(self, text: str) -> list[float]:
        """Generate embedding for a single text."""
        response = await self.client.embeddings.create(
            model=self.EMBEDDING_MODEL,
            input=text,
        )
        return response.data[0].embedding

    async def get_embeddings_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a batch of texts."""
        if not texts:
            return []

        all_embeddings = []
        for i in range(0, len(texts), self.BATCH_SIZE):
            batch = texts[i : i + self.BATCH_SIZE]
            response = await self.client.embeddings.create(
                model=self.EMBEDDING_MODEL,
                input=batch,
            )
            all_embeddings.extend([d.embedding for d in response.data])

        return all_embeddings

    async def clear_source(self, source_type: str, source_name: str | None = None) -> int:
        """Delete existing chunks for a source (idempotent re-ingestion)."""
        stmt = delete(KnowledgeChunk).where(KnowledgeChunk.source_type == source_type)
        if source_name:
            stmt = stmt.where(KnowledgeChunk.source_name == source_name)
        result = await self.db.execute(stmt)
        await self.db.commit()
        count = result.rowcount
        if count:
            logger.info(f"Cleared {count} chunks for source_type={source_type}, source_name={source_name}")
        return count

    async def ingest_machinery_data(self) -> int:
        """Ingest all machinery data into knowledge chunks."""
        await self.clear_source("machinery_description")
        await self.clear_source("machinery_theory")
        await self.clear_source("part_info")

        chunks_data = []

        for machinery_id, machinery in MACHINERY_DATA.items():
            # Overview chunk
            overview = f"{machinery['name']}: {machinery['description']}"
            if machinery.get("theory"):
                # Include a brief theory summary in overview
                theory_lines = machinery["theory"].split("\n")
                summary = " ".join(line.strip() for line in theory_lines[:3] if line.strip())
                overview += f" {summary}"

            chunks_data.append({
                "content": overview,
                "source_type": "machinery_description",
                "source_name": machinery_id,
                "machinery_id": machinery_id,
                "section": "overview",
                "chunk_index": 0,
                "language": "ko",
            })

            # Theory chunks - split by logical sections
            if machinery.get("theory"):
                theory_chunks = self._chunk_text(machinery["theory"], max_chars=600, overlap=50)
                for idx, chunk_text in enumerate(theory_chunks):
                    chunks_data.append({
                        "content": f"{machinery['name']} - 이론: {chunk_text}",
                        "source_type": "machinery_theory",
                        "source_name": machinery_id,
                        "machinery_id": machinery_id,
                        "section": "theory",
                        "chunk_index": idx,
                        "language": "ko",
                    })

            # Part chunks
            for idx, part in enumerate(machinery.get("parts", [])):
                part_text = f"{machinery['name']}의 부품 - {part['name']}"
                if part.get("role"):
                    part_text += f": {part['role']}"
                if part.get("material"):
                    part_text += f" (재질: {part['material']})"

                chunks_data.append({
                    "content": part_text,
                    "source_type": "part_info",
                    "source_name": machinery_id,
                    "machinery_id": machinery_id,
                    "part_name": part["name"],
                    "section": "part_detail",
                    "chunk_index": idx,
                    "language": "ko",
                })

        # Batch embed all chunks
        texts = [c["content"] for c in chunks_data]
        embeddings = await self.get_embeddings_batch(texts)

        # Create DB records
        for chunk_data, embedding in zip(chunks_data, embeddings):
            chunk = KnowledgeChunk(
                embedding=embedding,
                **chunk_data,
            )
            self.db.add(chunk)

        await self.db.commit()
        logger.info(f"Ingested {len(chunks_data)} machinery chunks")
        return len(chunks_data)

    async def ingest_quiz_knowledge(self) -> int:
        """Ingest quiz bank as knowledge chunks."""
        await self.clear_source("quiz_knowledge")

        chunks_data = []

        for idx, q in enumerate(QUIZ_DATA):
            # Combine question + correct answer + wrong answers for a rich knowledge chunk
            correct_text = q["options"][q["correct_answer"]]
            wrong_options = [opt for i, opt in enumerate(q["options"]) if i != q["correct_answer"]]
            wrong_text = ", ".join(wrong_options)
            content = f"퀴즈 지식 - {q['question']} 정답: {correct_text}. 오답: {wrong_text}"

            chunks_data.append({
                "content": content,
                "source_type": "quiz_knowledge",
                "source_name": q["machinery_id"],
                "machinery_id": q["machinery_id"],
                "section": "quiz_knowledge",
                "chunk_index": idx,
                "language": "ko",
            })

        texts = [c["content"] for c in chunks_data]
        embeddings = await self.get_embeddings_batch(texts)

        for chunk_data, embedding in zip(chunks_data, embeddings):
            chunk = KnowledgeChunk(embedding=embedding, **chunk_data)
            self.db.add(chunk)

        await self.db.commit()
        logger.info(f"Ingested {len(chunks_data)} quiz knowledge chunks")
        return len(chunks_data)

    async def ingest_wikipedia(self) -> int:
        """Fetch and ingest all configured Wikipedia articles."""
        await self.clear_source("wikipedia")

        wiki_service = WikipediaService()
        articles = await wiki_service.fetch_all_articles()

        chunks_data = []
        for article in articles:
            text_chunks = self._chunk_text(article["content"], max_chars=600, overlap=100)
            # Prefix chunks with article title + machinery name for richer embeddings
            machinery_name = MACHINERY_DATA.get(article["machinery_id"], {}).get("name", "")
            prefix = f"{article['title']} ({machinery_name}): " if machinery_name else f"{article['title']}: "
            for idx, chunk_text in enumerate(text_chunks):
                chunks_data.append({
                    "content": f"{prefix}{chunk_text}",
                    "source_type": "wikipedia",
                    "source_name": article["title"],
                    "machinery_id": article["machinery_id"],
                    "section": "wikipedia",
                    "chunk_index": idx,
                    "language": article["lang"],
                })

        if not chunks_data:
            logger.warning("No Wikipedia chunks to ingest")
            return 0

        texts = [c["content"] for c in chunks_data]
        embeddings = await self.get_embeddings_batch(texts)

        for chunk_data, embedding in zip(chunks_data, embeddings):
            chunk = KnowledgeChunk(embedding=embedding, **chunk_data)
            self.db.add(chunk)

        await self.db.commit()
        logger.info(f"Ingested {len(chunks_data)} Wikipedia chunks")
        return len(chunks_data)

    async def ingest_pdf(
        self,
        file_path: str,
        source_name: str,
        machinery_id: str | None = None,
    ) -> int:
        """
        Ingest a PDF file into the knowledge base.

        Args:
            file_path: Path to the PDF file
            source_name: Name for the source
            machinery_id: Optional machinery association

        Returns:
            Number of chunks created
        """
        try:
            import pymupdf
        except ImportError:
            logger.error("pymupdf not installed. Run: pip install pymupdf")
            raise ImportError("pymupdf is required for PDF ingestion")

        await self.clear_source("pdf_document", source_name)

        # Extract text from PDF
        doc = pymupdf.open(file_path)
        full_text = ""
        for page in doc:
            full_text += page.get_text() + "\n"
        doc.close()

        if not full_text.strip():
            logger.warning(f"No text extracted from PDF: {file_path}")
            return 0

        # Chunk the text
        text_chunks = self._chunk_text(full_text, max_chars=600, overlap=100)

        chunks_data = []
        for idx, chunk_text in enumerate(text_chunks):
            chunks_data.append({
                "content": f"{source_name}: {chunk_text}",
                "source_type": "pdf_document",
                "source_name": source_name,
                "machinery_id": machinery_id,
                "section": "pdf",
                "chunk_index": idx,
                "language": "ko",
            })

        texts = [c["content"] for c in chunks_data]
        embeddings = await self.get_embeddings_batch(texts)

        for chunk_data, embedding in zip(chunks_data, embeddings):
            chunk = KnowledgeChunk(embedding=embedding, **chunk_data)
            self.db.add(chunk)

        await self.db.commit()
        logger.info(f"Ingested {len(chunks_data)} PDF chunks from {source_name}")
        return len(chunks_data)

    async def ingest_text(
        self,
        text: str,
        source_name: str,
        source_type: str = "user_document",
        machinery_id: str | None = None,
    ) -> int:
        """Ingest raw text into the knowledge base."""
        await self.clear_source(source_type, source_name)

        text_chunks = self._chunk_text(text, max_chars=600, overlap=100)

        chunks_data = []
        for idx, chunk_text in enumerate(text_chunks):
            chunks_data.append({
                "content": chunk_text,
                "source_type": source_type,
                "source_name": source_name,
                "machinery_id": machinery_id,
                "section": source_type,
                "chunk_index": idx,
                "language": "ko",
            })

        texts = [c["content"] for c in chunks_data]
        embeddings = await self.get_embeddings_batch(texts)

        for chunk_data, embedding in zip(chunks_data, embeddings):
            chunk = KnowledgeChunk(embedding=embedding, **chunk_data)
            self.db.add(chunk)

        await self.db.commit()
        logger.info(f"Ingested {len(chunks_data)} text chunks from {source_name}")
        return len(chunks_data)

    async def get_stats(self) -> dict:
        """Get knowledge base statistics."""
        result = await self.db.execute(select(KnowledgeChunk))
        chunks = result.scalars().all()

        if not chunks:
            return {"total_chunks": 0, "by_source_type": {}, "by_machinery": {}}

        by_source_type: dict[str, int] = {}
        by_machinery: dict[str, int] = {}

        for chunk in chunks:
            by_source_type[chunk.source_type] = by_source_type.get(chunk.source_type, 0) + 1
            if chunk.machinery_id:
                by_machinery[chunk.machinery_id] = by_machinery.get(chunk.machinery_id, 0) + 1

        return {
            "total_chunks": len(chunks),
            "by_source_type": by_source_type,
            "by_machinery": by_machinery,
        }

    @staticmethod
    def _chunk_text(text: str, max_chars: int = 600, overlap: int = 100) -> list[str]:
        """
        Split text into chunks respecting sentence boundaries.

        Args:
            text: The text to chunk
            max_chars: Maximum characters per chunk
            overlap: Character overlap between chunks

        Returns:
            List of text chunks
        """
        if not text or not text.strip():
            return []

        text = text.strip()

        if len(text) <= max_chars:
            return [text]

        # Split by sentence-ending punctuation (Korean and English)
        sentences = re.split(r'(?<=[.!?。])\s+', text)

        chunks = []
        current_chunk = ""

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            if len(current_chunk) + len(sentence) + 1 <= max_chars:
                current_chunk = f"{current_chunk} {sentence}".strip() if current_chunk else sentence
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                    # Overlap: keep tail of current chunk
                    if overlap > 0 and len(current_chunk) > overlap:
                        current_chunk = current_chunk[-overlap:] + " " + sentence
                    else:
                        current_chunk = sentence
                else:
                    # Single sentence longer than max_chars — force split
                    for i in range(0, len(sentence), max_chars - overlap):
                        chunks.append(sentence[i : i + max_chars])
                    current_chunk = ""

        if current_chunk:
            chunks.append(current_chunk)

        return chunks
