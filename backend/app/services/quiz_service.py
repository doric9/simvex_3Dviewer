"""Quiz service for managing quiz operations."""

from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import GeneratedQuiz, QuizAttempt, MachineryProgress
from app.agents.quizzer import QuizzerAgent


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
        exclude_ids = []
        topics_learned = []

        if user_id:
            # Get previously answered questions
            result = await self.db.execute(
                select(QuizAttempt.question_id).where(
                    QuizAttempt.user_id == user_id,
                    QuizAttempt.machinery_id == machinery_id,
                )
            )
            exclude_ids = [row[0] for row in result.fetchall()]

            # Calculate accuracy
            result = await self.db.execute(
                select(QuizAttempt).where(
                    QuizAttempt.user_id == user_id,
                    QuizAttempt.machinery_id == machinery_id,
                )
            )
            attempts = result.scalars().all()
            if attempts:
                correct = sum(1 for a in attempts if a.is_correct)
                quiz_accuracy = correct / len(attempts)

            # Get topics learned from conversations with Explainer
            result = await self.db.execute(
                select(MachineryProgress).where(
                    MachineryProgress.user_id == user_id,
                    MachineryProgress.machinery_id == machinery_id,
                )
            )
            progress = result.scalar_one_or_none()
            if progress and progress.topics_learned:
                topics_learned = progress.topics_learned

        # Generate questions customized to learned topics
        questions = await self.quizzer.generate_quiz(
            machinery_id=machinery_id,
            count=count,
            quiz_accuracy=quiz_accuracy,
            exclude_ids=exclude_ids,
            topics_learned=topics_learned,
        )

        return questions

    async def grade_answer(
        self,
        question_text: str,
        options: list[str],
        selected_answer: int,
        correct_answer: int,
    ) -> tuple[bool, str]:
        """
        Grade an answer and get feedback.

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
