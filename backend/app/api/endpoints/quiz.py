"""Quiz endpoints for the Quizzer agent."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.schemas import (
    QuizGenerateRequest,
    QuizGenerateResponse,
    QuizAnswerRequest,
    QuizAnswerResponse,
    QuizQuestion,
)
from app.services.quiz_service import QuizService
from app.services.progress_service import ProgressService
from app.data.machinery import get_machinery
from app.utils.rate_limiter import RateLimitExceeded

router = APIRouter()


@router.post("/{machinery_id}/generate", response_model=QuizGenerateResponse)
async def generate_quiz(
    machinery_id: str,
    request: QuizGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate quiz questions for a specific machinery.

    Uses adaptive difficulty based on user's past performance.
    """
    # Validate machinery exists
    if not get_machinery(machinery_id):
        raise HTTPException(status_code=404, detail=f"Machinery '{machinery_id}' not found")

    try:
        quiz_service = QuizService(db)

        questions = await quiz_service.generate_quiz(
            machinery_id=machinery_id,
            user_id=request.user_id,
            count=request.count,
        )

        # Convert to response format
        quiz_questions = [
            QuizQuestion(
                id=q["id"],
                question=q["question"],
                options=q["options"],
                machinery_id=machinery_id,
            )
            for q in questions
        ]

        return QuizGenerateResponse(questions=quiz_questions)

    except RateLimitExceeded as e:
        return JSONResponse(
            status_code=429,
            content={"detail": e.message},
            headers={"Retry-After": str(int(e.retry_after))},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation error: {str(e)}")


@router.post("/{machinery_id}/answer", response_model=QuizAnswerResponse)
async def answer_quiz(
    machinery_id: str,
    request: QuizAnswerRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Submit an answer to a quiz question and get feedback.

    Records the attempt for progress tracking if user_id is provided.
    """
    # Validate machinery exists
    if not get_machinery(machinery_id):
        raise HTTPException(status_code=404, detail=f"Machinery '{machinery_id}' not found")

    try:
        quiz_service = QuizService(db)
        progress_service = ProgressService(db)

        # Grade the answer
        is_correct, feedback = await quiz_service.grade_answer(
            question_text=request.question_text,
            options=request.options,
            selected_answer=request.selected_answer,
            correct_answer=request.correct_answer,
            user_id=request.user_id,
        )

        # Record attempt if user_id provided
        if request.user_id:
            await progress_service.record_quiz_attempt(
                user_id=request.user_id,
                machinery_id=machinery_id,
                question_id=request.question_id,
                question_text=request.question_text,
                selected_answer=request.selected_answer,
                correct_answer=request.correct_answer,
            )
            await progress_service.update_user_activity(request.user_id)

        return QuizAnswerResponse(
            is_correct=is_correct,
            correct_answer=request.correct_answer,
            feedback=feedback,
        )

    except RateLimitExceeded as e:
        return JSONResponse(
            status_code=429,
            content={"detail": e.message},
            headers={"Retry-After": str(int(e.retry_after))},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Answer grading error: {str(e)}")
