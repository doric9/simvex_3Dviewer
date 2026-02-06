"""Quiz service for managing quiz operations."""

import asyncio
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import GeneratedQuiz, QuizAttempt, MachineryProgress
from app.agents.quizzer import QuizzerAgent
from app.services.retrieval_service import RetrievalService


class QuizService:
    """Service for quiz operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.quizzer = QuizzerAgent()

    async def generate_quiz(
        self,
        machinery_id: str,
        user_id: Optional[str] = None,
        count: int = 3,
    ) -> list[dict]:
        """
        Generate quiz questions for a machinery.

        Uses adaptive difficulty based on user's past performance.
        Customizes questions based on topics discussed with Explainer.
        """
        # Get user's accuracy and topics for this machinery if user_id provided
        quiz_accuracy = 0.5  # Default to medium difficulty
        exclude_ids: list[str] = []
        topics_learned: list[str] = []

        if user_id:
            # Run both DB queries in parallel (they are independent)
            async def _fetch_attempts():
                result = await self.db.execute(
                    select(QuizAttempt).where(
                        QuizAttempt.user_id == user_id,
                        QuizAttempt.machinery_id == machinery_id,
                    )
                )
                return result.scalars().all()

            async def _fetch_topics():
                result = await self.db.execute(
                    select(MachineryProgress).where(
                        MachineryProgress.user_id == user_id,
                        MachineryProgress.machinery_id == machinery_id,
                    )
                )
                return result.scalar_one_or_none()

            attempts, progress = await asyncio.gather(
                _fetch_attempts(), _fetch_topics()
            )

            # Derive exclude_ids + accuracy from the single attempts query
            if attempts:
                exclude_ids = [a.question_id for a in attempts]
                correct = sum(1 for a in attempts if a.is_correct)
                quiz_accuracy = correct / len(attempts)

            if progress and progress.topics_learned:
                topics_learned = progress.topics_learned

        # Check if bank questions alone can satisfy the request before
        # doing any expensive work (RAG embedding API call).
        from app.data.quiz_bank import get_questions_by_machinery

        bank_questions = get_questions_by_machinery(machinery_id)
        available_bank = [q for q in bank_questions if q["id"] not in exclude_ids]
        needs_llm = len(available_bank) < count

        # Only retrieve RAG context when LLM generation is actually needed
        rag_context = None
        if needs_llm:
            try:
                retrieval = RetrievalService(self.db)
                query = f"{machinery_id} 퀴즈"
                if topics_learned:
                    query += " " + " ".join(topics_learned[:3])
                rag_context_str, _ = await asyncio.wait_for(
                    retrieval.retrieve_for_context(
                        query=query,
                        machinery_id=machinery_id,
                        max_chars=1500,
                    ),
                    timeout=2.0,
                )
                if rag_context_str:
                    rag_context = rag_context_str
            except (asyncio.TimeoutError, Exception):
                pass  # RAG is additive — quiz generation works without it

        # Generate questions customized to learned topics
        questions = await self.quizzer.generate_quiz(
            machinery_id=machinery_id,
            count=count,
            quiz_accuracy=quiz_accuracy,
            exclude_ids=exclude_ids,
            topics_learned=topics_learned,
            user_id=user_id,
            rag_context=rag_context,
        )

        return questions

    async def grade_answer(
        self,
        question_text: str,
        options: list[str],
        selected_answer: int,
        correct_answer: int,
        user_id: str | None = None,
    ) -> tuple[bool, str]:
        """
        Grade an answer and get feedback.

        Args:
            question_text: The quiz question text
            options: List of answer options
            selected_answer: Index of the selected answer
            correct_answer: Index of the correct answer
            user_id: Optional user ID for rate limiting

        Returns:
            tuple: (is_correct, feedback)
        """
        is_correct = selected_answer == correct_answer

        # Get AI feedback
        feedback = await self.quizzer.grade_answer(
            question=question_text,
            options=options,
            selected_answer=selected_answer,
            correct_answer=correct_answer,
            user_id=user_id,
        )

        return is_correct, feedback

    async def save_generated_quiz(
        self,
        machinery_id: str,
        question: str,
        options: list[str],
        correct_answer: int,
        difficulty: str = "medium",
        topic: Optional[str] = None,
    ) -> GeneratedQuiz:
        """Save a generated quiz question for reuse."""
        quiz = GeneratedQuiz(
            machinery_id=machinery_id,
            question=question,
            options=options,
            correct_answer=correct_answer,
            difficulty=difficulty,
            topic=topic,
        )
        self.db.add(quiz)
        await self.db.commit()
        await self.db.refresh(quiz)
        return quiz

    async def get_saved_quizzes(
        self,
        machinery_id: str,
        difficulty: Optional[str] = None,
        limit: int = 10,
    ) -> list[GeneratedQuiz]:
        """Get saved generated quizzes."""
        query = select(GeneratedQuiz).where(
            GeneratedQuiz.machinery_id == machinery_id
        )

        if difficulty:
            query = query.where(GeneratedQuiz.difficulty == difficulty)

        query = query.limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()
