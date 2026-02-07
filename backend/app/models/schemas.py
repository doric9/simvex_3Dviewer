from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# Chat Schemas
class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[ChatMessage] = []
    user_id: Optional[str] = None


class SourceReference(BaseModel):
    source_name: str
    section: Optional[str] = None
    machinery_id: Optional[str] = None
    relevance_score: float = 0.0


class ChatResponse(BaseModel):
    response: str
    topics_discussed: list[str] = []
    from_cache: bool = False
    cache_similarity: Optional[float] = None
    sources: list[SourceReference] = []


class FeedbackRequest(BaseModel):
    question: str
    positive: bool


# Quiz Schemas
class QuizQuestion(BaseModel):
    id: str
    question: str
    options: list[str]
    machinery_id: str
    correct_answer: Optional[int] = None


class QuizGenerateRequest(BaseModel):
    user_id: Optional[str] = None
    count: int = Field(default=3, ge=1, le=10)


class QuizGenerateResponse(BaseModel):
    questions: list[QuizQuestion]


class QuizAnswerRequest(BaseModel):
    question_id: str
    question_text: str
    options: list[str]
    selected_answer: int
    correct_answer: int
    user_id: Optional[str] = None


class QuizAnswerResponse(BaseModel):
    is_correct: bool
    correct_answer: int
    feedback: str


# Progress Schemas
class MachineryProgressResponse(BaseModel):
    machinery_id: str
    topics_learned: list[str]
    quiz_attempts: int
    quiz_correct: int
    quiz_accuracy: float
    last_quiz_at: Optional[datetime]

    class Config:
        from_attributes = True


class UserProgressResponse(BaseModel):
    user_id: str
    total_quiz_attempts: int
    total_quiz_correct: int
    overall_accuracy: float
    machinery_progress: list[MachineryProgressResponse]
    last_active: datetime

    class Config:
        from_attributes = True


# Note Schemas
class NoteBase(BaseModel):
    content: str
    machinery_id: str
    part_name: Optional[str] = None


class NoteCreate(NoteBase):
    id: Optional[str] = None
    user_id: str


class NoteUpdate(BaseModel):
    content: Optional[str] = None
    part_name: Optional[str] = None


class NoteResponse(NoteBase):
    id: str
    user_id: str
    timestamp: datetime

    class Config:
        from_attributes = True
