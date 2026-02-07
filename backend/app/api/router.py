from fastapi import APIRouter

from app.api.endpoints import chat, quiz, progress, notes, knowledge

api_router = APIRouter()

api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(quiz.router, prefix="/quiz", tags=["quiz"])
api_router.include_router(progress.router, prefix="/progress", tags=["progress"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
