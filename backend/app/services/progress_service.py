"""Progress tracking service."""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import User, MachineryProgress, QuizAttempt, LearningSession, Note


class ProgressService:
    """Service for tracking user learning progress."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_user(self, user_id: str) -> User:
        """Get or create a user."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            user = User(id=user_id)
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)

        return user

    async def update_user_activity(self, user_id: str) -> None:
        """Update user's last active timestamp."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user:
            user.last_active = datetime.now(timezone.utc)
            await self.db.commit()

    async def get_machinery_progress(
        self, user_id: str, machinery_id: str
    ) -> Optional[MachineryProgress]:
        """Get progress for a specific machinery."""
        result = await self.db.execute(
            select(MachineryProgress).where(
                MachineryProgress.user_id == user_id,
                MachineryProgress.machinery_id == machinery_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_or_create_machinery_progress(
        self, user_id: str, machinery_id: str
    ) -> MachineryProgress:
        """Get or create progress record for a machinery."""
        await self.get_or_create_user(user_id)

        progress = await self.get_machinery_progress(user_id, machinery_id)
        if not progress:
            progress = MachineryProgress(
                user_id=user_id,
                machinery_id=machinery_id,
            )
            self.db.add(progress)
            await self.db.commit()
            await self.db.refresh(progress)

        return progress

    async def add_topics_learned(
        self, user_id: str, machinery_id: str, topics: list[str]
    ) -> MachineryProgress:
        """Add topics to the learned list."""
        progress = await self.get_or_create_machinery_progress(user_id, machinery_id)

        # Add new topics (avoid duplicates)
        current_topics = set(progress.topics_learned or [])
        current_topics.update(topics)
        progress.topics_learned = list(current_topics)

        await self.db.commit()
        await self.db.refresh(progress)
        return progress

    async def record_quiz_attempt(
        self,
        user_id: str,
        machinery_id: str,
        question_id: str,
        question_text: str,
        selected_answer: int,
        correct_answer: int,
    ) -> tuple[QuizAttempt, MachineryProgress]:
        """Record a quiz attempt and update progress."""
        is_correct = selected_answer == correct_answer

        # Create quiz attempt record
        attempt = QuizAttempt(
            user_id=user_id,
            machinery_id=machinery_id,
            question_id=question_id,
            question_text=question_text,
            selected_answer=selected_answer,
            correct_answer=correct_answer,
            is_correct=is_correct,
        )
        self.db.add(attempt)

        # Update machinery progress
        progress = await self.get_or_create_machinery_progress(user_id, machinery_id)
        progress.quiz_attempts += 1
        if is_correct:
            progress.quiz_correct += 1
        progress.quiz_accuracy = (
            progress.quiz_correct / progress.quiz_attempts
            if progress.quiz_attempts > 0
            else 0.0
        )
        progress.last_quiz_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(attempt)
        await self.db.refresh(progress)

        return attempt, progress

    async def get_user_progress(self, user_id: str) -> dict:
        """Get overall progress for a user."""
        user = await self.get_or_create_user(user_id)

        # Get all machinery progress
        result = await self.db.execute(
            select(MachineryProgress).where(MachineryProgress.user_id == user_id)
        )
        machinery_progress = result.scalars().all()

        # Calculate totals
        total_attempts = sum(p.quiz_attempts for p in machinery_progress)
        total_correct = sum(p.quiz_correct for p in machinery_progress)
        overall_accuracy = total_correct / total_attempts if total_attempts > 0 else 0.0

        return {
            "user_id": user_id,
            "total_quiz_attempts": total_attempts,
            "total_quiz_correct": total_correct,
            "overall_accuracy": overall_accuracy,
            "machinery_progress": [
                {
                    "machinery_id": p.machinery_id,
                    "topics_learned": p.topics_learned,
                    "quiz_attempts": p.quiz_attempts,
                    "quiz_correct": p.quiz_correct,
                    "quiz_accuracy": p.quiz_accuracy,
                    "last_quiz_at": p.last_quiz_at,
                }
                for p in machinery_progress
            ],
            "last_active": user.last_active,
        }

    async def start_session(
        self, user_id: str, machinery_id: str
    ) -> LearningSession:
        """Start a new learning session."""
        await self.get_or_create_user(user_id)

        session = LearningSession(
            user_id=user_id,
            machinery_id=machinery_id,
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def end_session(self, session_id: int) -> Optional[LearningSession]:
        """End a learning session."""
        result = await self.db.execute(
            select(LearningSession).where(LearningSession.id == session_id)
        )
        session = result.scalar_one_or_none()

        if session:
            session.ended_at = datetime.now(timezone.utc)
            await self.db.commit()
            await self.db.refresh(session)

        return session

    async def update_session_history(
        self,
        session_id: int,
        conversation_history: list[dict],
        topics: list[str],
    ) -> Optional[LearningSession]:
        """Update session with conversation history and topics."""
        result = await self.db.execute(
            select(LearningSession).where(LearningSession.id == session_id)
        )
        session = result.scalar_one_or_none()

        if session:
            session.conversation_history = conversation_history
            # Merge topics
            current_topics = set(session.topics_discussed or [])
            current_topics.update(topics)
            session.topics_discussed = list(current_topics)
            await self.db.commit()
            await self.db.refresh(session)

        return session

    async def reset_user_data(self, user_id: str) -> None:
        """Clear all data for a specific user."""
        from sqlalchemy import delete
        
        # Delete quiz attempts
        await self.db.execute(delete(QuizAttempt).where(QuizAttempt.user_id == user_id))
        
        # Delete machinery progress
        await self.db.execute(delete(MachineryProgress).where(MachineryProgress.user_id == user_id))
        
        # Delete learning sessions
        await self.db.execute(delete(LearningSession).where(LearningSession.user_id == user_id))
        
        # Delete notes
        await self.db.execute(delete(Note).where(Note.user_id == user_id))
        
        # Optionally delete user
        await self.db.execute(delete(User).where(User.id == user_id))
        
        await self.db.commit()
