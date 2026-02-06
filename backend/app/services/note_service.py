"""Note management service."""

from typing import Optional
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from app.models.database import Note, User
from app.models.schemas import NoteCreate, NoteUpdate


class NoteService:
    """Service for managing user notes."""

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

    async def get_user_notes(self, user_id: str) -> list[Note]:
        """Get all notes for a user."""
        result = await self.db.execute(
            select(Note).where(Note.user_id == user_id).order_by(Note.timestamp.desc())
        )
        return list(result.scalars().all())

    async def create_note(self, note_data: NoteCreate) -> Note:
        """Create a new note."""
        await self.get_or_create_user(note_data.user_id)

        note = Note(
            id=note_data.id or f"note_{int(datetime.now(timezone.utc).timestamp())}",
            user_id=note_data.user_id,
            machinery_id=note_data.machinery_id,
            part_name=note_data.part_name,
            content=note_data.content,
        )
        self.db.add(note)
        await self.db.commit()
        await self.db.refresh(note)
        return note

    async def update_note(self, note_id: str, note_data: NoteUpdate) -> Optional[Note]:
        """Update an existing note."""
        result = await self.db.execute(select(Note).where(Note.id == note_id))
        note = result.scalar_one_or_none()

        if note:
            if note_data.content is not None:
                note.content = note_data.content
            if note_data.part_name is not None:
                note.part_name = note_data.part_name
            
            await self.db.commit()
            await self.db.refresh(note)

        return note

    async def delete_note(self, note_id: str) -> bool:
        """Delete a note."""
        result = await self.db.execute(delete(Note).where(Note.id == note_id))
        await self.db.commit()
        return result.rowcount > 0
