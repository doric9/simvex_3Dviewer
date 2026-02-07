"""Quiz endpoints for the Quizzer agent."""

import asyncio
import json
from collections import OrderedDict

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from starlette.responses import StreamingResponse
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
from app.agents.quizzer import QuizzerAgent
from app.data.machinery import get_machinery
from app.utils.rate_limiter import RateLimitExceeded

router = APIRouter()

# In-memory feedback cache: (question_text, selected_answer, correct_answer) -> feedback
_FEEDBACK_CACHE_MAX = 500


class _FeedbackCache(OrderedDict):
    """LRU cache implemented as an OrderedDict with a max size."""

    def __init__(self, maxsize: int):
        super().__init__()
        self._maxsize = maxsize

    def get_feedback(self, key: tuple) -> str | None:
        if key in self:
            self.move_to_end(key)
            return self[key]
        return None

    def store_feedback(self, key: tuple, value: str):
        self[key] = value
        self.move_to_end(key)
        if len(self) > self._maxsize:
            self.popitem(last=False)


_feedback_cache = _FeedbackCache(_FEEDBACK_CACHE_MAX)


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
                correct_answer=q.get("correct_answer"),
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


@router.post("/{machinery_id}/answer/stream")
async def answer_quiz_stream(
    machinery_id: str,
    request: QuizAnswerRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Submit an answer and stream AI feedback via Server-Sent Events.

    Immediately returns correctness, then streams feedback tokens.
    Uses an in-memory cache for repeated question/answer combinations.
    """
    if not get_machinery(machinery_id):
        raise HTTPException(status_code=404, detail=f"Machinery '{machinery_id}' not found")

    is_correct = request.selected_answer == request.correct_answer
    cache_key = (request.question_text, request.selected_answer, request.correct_answer)

    async def generate():
        try:
            # 1. Immediately yield correctness result (no LLM needed)
            yield f"data: {json.dumps({'is_correct': is_correct, 'correct_answer': request.correct_answer})}\n\n"

            # 2. Check feedback cache
            cached = _feedback_cache.get_feedback(cache_key)

            if cached:
                # Stream cached feedback in fast chunks
                chunk_size = 20
                for i in range(0, len(cached), chunk_size):
                    yield f"data: {json.dumps({'text': cached[i:i + chunk_size]})}\n\n"
                    await asyncio.sleep(0.005)
                yield f"data: {json.dumps({'done': True, 'feedback': cached, 'from_cache': True})}\n\n"
            else:
                # 3. Stream LLM feedback tokens
                quizzer = QuizzerAgent()
                full_feedback = ""

                async for chunk in quizzer.grade_answer_stream(
                    question=request.question_text,
                    options=request.options,
                    selected_answer=request.selected_answer,
                    correct_answer=request.correct_answer,
                    user_id=request.user_id,
                ):
                    full_feedback += chunk
                    yield f"data: {json.dumps({'text': chunk})}\n\n"

                # Fallback if LLM returned nothing
                if not full_feedback:
                    if is_correct:
                        full_feedback = "정답입니다! 잘 하셨습니다."
                    else:
                        opt = request.options[request.correct_answer] if 0 <= request.correct_answer < len(request.options) else ""
                        full_feedback = f"오답입니다. 정답은 {request.correct_answer + 1}번 '{opt}'입니다."
                    yield f"data: {json.dumps({'text': full_feedback})}\n\n"

                # 4. Done event
                yield f"data: {json.dumps({'done': True, 'feedback': full_feedback})}\n\n"

                # 5. Cache + record progress (non-blocking)
                _feedback_cache.store_feedback(cache_key, full_feedback)

            # Record progress
            if request.user_id:
                try:
                    progress_service = ProgressService(db)
                    await progress_service.record_quiz_attempt(
                        user_id=request.user_id,
                        machinery_id=machinery_id,
                        question_id=request.question_id,
                        question_text=request.question_text,
                        selected_answer=request.selected_answer,
                        correct_answer=request.correct_answer,
                    )
                    await progress_service.update_user_activity(request.user_id)
                except Exception:
                    pass  # Don't fail the stream for progress tracking errors

        except RateLimitExceeded as e:
            yield f"data: {json.dumps({'error': e.message, 'retry_after': e.retry_after})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
