"""Note management endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.schemas import NoteResponse, NoteCreate, NoteUpdate
from app.services.note_service import NoteService

router = APIRouter()


@router.get("/{user_id}", response_model=list[NoteResponse])
async def get_user_notes(
    user_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get all notes for a user."""
    note_service = NoteService(db)
    return await note_service.get_user_notes(user_id)


@router.post("/", response_model=NoteResponse)
async def create_note(
    note_data: NoteCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new note."""
    note_service = NoteService(db)
    return await note_service.create_note(note_data)


@router.patch("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: str,
    note_data: NoteUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing note."""
    note_service = NoteService(db)
    note = await note_service.update_note(note_id, note_data)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete a note."""
    note_service = NoteService(db)
    success = await note_service.delete_note(note_id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"status": "success"}
