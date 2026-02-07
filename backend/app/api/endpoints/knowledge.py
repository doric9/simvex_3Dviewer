"""Knowledge base API endpoints for search, stats, and ingestion."""

import logging
import tempfile
import os

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.services.retrieval_service import RetrievalService
from app.services.ingestion_service import IngestionService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/search")
async def search_knowledge(
    q: str = Query(..., min_length=1, description="Search query"),
    machinery_id: str | None = Query(None, description="Filter by machinery ID"),
    limit: int = Query(10, ge=1, le=50, description="Max results"),
    db: AsyncSession = Depends(get_db),
):
    """Search the knowledge base for relevant content."""
    try:
        retrieval = RetrievalService(db)
        results = await retrieval.search(
            query=q,
            machinery_id=machinery_id,
            top_k=limit,
        )

        return {
            "query": q,
            "results": [
                {
                    "content": r.content,
                    "source_name": r.source_name,
                    "source_type": r.source_type,
                    "section": r.section,
                    "machinery_id": r.machinery_id,
                    "relevance_score": r.relevance_score,
                    "language": r.language,
                }
                for r in results
            ],
            "count": len(results),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


@router.get("/stats")
async def knowledge_stats(
    db: AsyncSession = Depends(get_db),
):
    """Get knowledge base statistics."""
    try:
        ingestion = IngestionService(db)
        stats = await ingestion.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats error: {str(e)}")


@router.post("/ingest/pdf")
async def ingest_pdf(
    file: UploadFile = File(...),
    machinery_id: str | None = Query(None, description="Associate with machinery"),
    db: AsyncSession = Depends(get_db),
):
    """Upload and ingest a PDF file into the knowledge base."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        # Save uploaded file to temp location
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            ingestion = IngestionService(db)
            count = await ingestion.ingest_pdf(
                file_path=tmp_path,
                source_name=file.filename,
                machinery_id=machinery_id,
            )
            return {
                "status": "ok",
                "filename": file.filename,
                "chunks_created": count,
            }
        finally:
            os.unlink(tmp_path)

    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="pymupdf not installed. PDF ingestion unavailable.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion error: {str(e)}")


@router.post("/ingest/refresh")
async def refresh_builtin_knowledge(
    db: AsyncSession = Depends(get_db),
):
    """Re-ingest built-in machinery and quiz data."""
    try:
        ingestion = IngestionService(db)
        m_count = await ingestion.ingest_machinery_data()
        q_count = await ingestion.ingest_quiz_knowledge()
        return {
            "status": "ok",
            "machinery_chunks": m_count,
            "quiz_chunks": q_count,
            "total": m_count + q_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refresh error: {str(e)}")
