"""Chat endpoints for the Explainer agent."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.schemas import ChatRequest, ChatResponse, FeedbackRequest, SourceReference
from app.agents.explainer import ExplainerAgent
from app.services.progress_service import ProgressService
from app.services.cache_service import CacheService
from app.services.retrieval_service import RetrievalService
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
    Uses semantic caching for instant responses to similar questions.
    """
    # Validate machinery exists
    if not get_machinery(machinery_id):
        raise HTTPException(status_code=404, detail=f"Machinery '{machinery_id}' not found")

    try:
        # Check cache for similar question (only for simple questions without context)
        cache_service = CacheService(db)

        # Only use cache for direct questions (no conversation history)
        if len(request.conversation_history) == 0:
            cached_answer, similarity = await cache_service.find_cached_answer(
                machinery_id, request.message
            )
            if cached_answer:
                # Return cached response immediately
                return ChatResponse(
                    response=cached_answer,
                    topics_discussed=[],
                    from_cache=True,
                    cache_similarity=round(similarity, 3),
                )

        # Retrieve RAG context
        rag_context = None
        sources = []
        try:
            retrieval_service = RetrievalService(db)
            rag_context_str, rag_results = await retrieval_service.retrieve_for_context(
                query=request.message,
                machinery_id=machinery_id,
            )
            if rag_context_str:
                rag_context = rag_context_str
                sources = [
                    SourceReference(
                        source_name=r.source_name,
                        section=r.section,
                        machinery_id=r.machinery_id,
                        relevance_score=r.relevance_score,
                    )
                    for r in rag_results
                ]
        except Exception:
            pass  # RAG is additive — chat works without it

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
            rag_context=rag_context,
        )

        # Cache the response for future similar questions
        if len(request.conversation_history) == 0 and len(response_text) > 50:
            try:
                await cache_service.cache_answer(
                    machinery_id, request.message, response_text
                )
            except Exception:
                # Don't fail the request if caching fails
                pass

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
            from_cache=False,
            sources=sources,
        )

    except RateLimitExceeded as e:
        return JSONResponse(
            status_code=429,
            content={"detail": e.message},
            headers={"Retry-After": str(int(e.retry_after))},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@router.post("/{machinery_id}/stream")
async def chat_stream(
    machinery_id: str,
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Stream a response from the Explainer agent using Server-Sent Events.

    The response is streamed in real-time as tokens are generated,
    providing faster perceived response time. Uses semantic cache for
    instant responses to similar questions.
    """
    import asyncio
    import json

    # Validate machinery exists
    if not get_machinery(machinery_id):
        raise HTTPException(status_code=404, detail=f"Machinery '{machinery_id}' not found")

    # Check cache first for direct questions (no conversation history)
    cache_service = CacheService(db)
    cached_answer = None
    cache_similarity = 0.0

    if len(request.conversation_history) == 0:
        cached_answer, cache_similarity = await cache_service.find_cached_answer(
            machinery_id, request.message
        )

    # Retrieve RAG context for streaming
    rag_context = None
    sources_data = []
    if not cached_answer:
        try:
            retrieval_service = RetrievalService(db)
            rag_context_str, rag_results = await retrieval_service.retrieve_for_context(
                query=request.message,
                machinery_id=machinery_id,
            )
            if rag_context_str:
                rag_context = rag_context_str
                sources_data = [
                    {"source_name": r.source_name, "section": r.section, "machinery_id": r.machinery_id, "relevance_score": r.relevance_score}
                    for r in rag_results
                ]
        except Exception:
            pass  # RAG is additive

    async def generate():
        """Generate SSE events for streaming response."""
        nonlocal cached_answer

        try:
            # If we have a cached answer, stream it quickly in chunks
            if cached_answer:
                # Stream cached response in fast chunks (simulating fast typing)
                chunk_size = 10  # Characters per chunk
                for i in range(0, len(cached_answer), chunk_size):
                    chunk = cached_answer[i:i + chunk_size]
                    yield f"data: {json.dumps({'text': chunk, 'from_cache': True})}\n\n"
                    await asyncio.sleep(0.005)  # 5ms delay for smooth streaming

                # Send completion event
                yield f"data: {json.dumps({'done': True, 'topics': [], 'from_cache': True, 'cache_similarity': round(cache_similarity, 3)})}\n\n"
                return

            # No cache hit - generate fresh response
            explainer = ExplainerAgent()

            # Convert conversation history
            history = [
                {"role": msg.role, "content": msg.content}
                for msg in request.conversation_history
            ]

            # Collect full response for topic extraction and caching
            full_response = ""

            # Stream tokens
            async for chunk in explainer.invoke_stream(
                machinery_id=machinery_id,
                user_message=request.message,
                conversation_history=history,
                user_id=request.user_id,
                rag_context=rag_context,
            ):
                full_response += chunk
                yield f"data: {json.dumps({'text': chunk})}\n\n"

            # Extract topics from full response
            topics = explainer._extract_topics(request.message, full_response, machinery_id)

            # Cache the response for future similar questions
            if len(request.conversation_history) == 0 and len(full_response) > 50:
                try:
                    await cache_service.cache_answer(
                        machinery_id, request.message, full_response
                    )
                except Exception as cache_error:
                    # Don't fail the request if caching fails
                    pass

            # Track progress if user_id provided
            if request.user_id and topics:
                progress_service = ProgressService(db)
                await progress_service.add_topics_learned(
                    user_id=request.user_id,
                    machinery_id=machinery_id,
                    topics=topics,
                )
                await progress_service.update_user_activity(request.user_id)

            # Send completion event with topics and sources
            yield f"data: {json.dumps({'done': True, 'topics': topics, 'sources': sources_data})}\n\n"

        except RateLimitExceeded as e:
            yield f"data: {json.dumps({'error': e.message, 'retry_after': e.retry_after})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    from starlette.responses import StreamingResponse
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.post("/{machinery_id}/feedback")
async def submit_feedback(
    machinery_id: str,
    request: FeedbackRequest,
    db: AsyncSession = Depends(get_db),
):
    """Submit user feedback (thumbs up/down) for a cached answer."""
    if not get_machinery(machinery_id):
        raise HTTPException(status_code=404, detail=f"Machinery '{machinery_id}' not found")

    try:
        cache_service = CacheService(db)
        await cache_service.update_quality_score(
            machinery_id=machinery_id,
            question=request.question,
            positive=request.positive,
        )
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback error: {str(e)}")
