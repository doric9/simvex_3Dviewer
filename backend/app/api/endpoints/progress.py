"""Progress tracking endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.schemas import UserProgressResponse, MachineryProgressResponse
from app.services.progress_service import ProgressService
from app.data.machinery import get_machinery

router = APIRouter()


@router.get("/{user_id}", response_model=UserProgressResponse)
async def get_user_progress(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get overall learning progress for a user.

    Returns total quiz attempts, accuracy, and per-machinery breakdown.
    """
    try:
        progress_service = ProgressService(db)
        progress = await progress_service.get_user_progress(user_id)
        return UserProgressResponse(**progress)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Progress retrieval error: {str(e)}")


@router.get("/{user_id}/{machinery_id}", response_model=MachineryProgressResponse)
async def get_machinery_progress(
    user_id: str,
    machinery_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get learning progress for a specific machinery.

    Returns topics learned, quiz attempts, and accuracy for the machinery.
    """
    # Validate machinery exists
    machinery = get_machinery(machinery_id)
    if not machinery:
        raise HTTPException(status_code=404, detail=f"Machinery '{machinery_id}' not found")

    try:
        progress_service = ProgressService(db)
        progress = await progress_service.get_or_create_machinery_progress(
            user_id=user_id,
            machinery_id=machinery_id,
        )

        return MachineryProgressResponse(
            machinery_id=progress.machinery_id,
            topics_learned=progress.topics_learned or [],
            quiz_attempts=progress.quiz_attempts,
            quiz_correct=progress.quiz_correct,
            quiz_accuracy=progress.quiz_accuracy,
            last_quiz_at=progress.last_quiz_at,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Progress retrieval error: {str(e)}")
@router.post("/{user_id}/reset")
async def reset_user_progress(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Reset all learning progress, notes, and sessions for a user.
    """
    try:
        progress_service = ProgressService(db)
        # We also need to delete notes, so we can use NoteService or just delete in ProgressService
        # Let's add a reset_user method to ProgressService for simplicity
        await progress_service.reset_user_data(user_id)
        return {"status": "success", "message": "User data reset successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Account reset error: {str(e)}")
