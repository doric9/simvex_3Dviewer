"""Chat endpoints for the Explainer agent."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.schemas import ChatRequest, ChatResponse
from app.agents.explainer import ExplainerAgent
from app.services.progress_service import ProgressService
from app.data.machinery import get_machinery
from app.utils.rate_limiter import RateLimitExceeded

router = APIRouter()


@router.post("/{machinery_id}", response_model=ChatResponse)
async def chat_with_explainer(
    machinery_id: str,
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Send a message to the Explainer agent for a specific machinery.

    The agent will explain concepts, answer questions, and help students
    understand the machinery's structure and operation.
    """
    # Validate machinery exists
    if not get_machinery(machinery_id):
        raise HTTPException(status_code=404, detail=f"Machinery '{machinery_id}' not found")

    try:
        # Initialize agent
        explainer = ExplainerAgent()

        # Convert conversation history to expected format
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation_history
        ]

        # Get response from agent
        response_text, topics = await explainer.invoke(
            machinery_id=machinery_id,
            user_message=request.message,
            conversation_history=history,
            user_id=request.user_id,
        )

        # Track progress if user_id provided
        if request.user_id and topics:
            progress_service = ProgressService(db)
            await progress_service.add_topics_learned(
                user_id=request.user_id,
                machinery_id=machinery_id,
                topics=topics,
            )
            await progress_service.update_user_activity(request.user_id)

        return ChatResponse(
            response=response_text,
            topics_discussed=topics,
        )

    except RateLimitExceeded as e:
        return JSONResponse(
            status_code=429,
            content={"detail": e.message},
            headers={"Retry-After": str(int(e.retry_after))},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")
