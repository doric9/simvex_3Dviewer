"""Base agent class for AI agents."""

from abc import ABC, abstractmethod
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from app.config import get_settings
from app.utils.rate_limiter import get_rate_limiter


class BaseAgent(ABC):
    """Base class for all AI agents."""

    def __init__(self, model: str | None = None, temperature: float = 0.7):
        settings = get_settings()
        # Use model from settings if not specified
        model = model or settings.openai_model
        # GPT-5 models use the Responses API
        use_responses = model.startswith("gpt-5")
        self.llm = ChatOpenAI(
            model=model,
            temperature=temperature,
            max_tokens=1000,
            api_key=settings.openai_api_key,
            use_responses_api=use_responses,
        )
        self._rate_limiter = get_rate_limiter()

    @abstractmethod
    async def invoke(self, *args, **kwargs) -> str:
        """Invoke the agent with input."""
        pass

    async def _invoke_llm(self, messages: list, user_id: str | None = None):
        """
        Invoke LLM with rate limiting and retry logic.

        Args:
            messages: List of messages to send to the LLM
            user_id: Optional user ID for per-user rate limiting

        Returns:
            LLM response
        """
        async def _call():
            return await self.llm.ainvoke(messages)

        return await self._rate_limiter.execute_with_retry(_call, user_id)

    def _build_messages(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: list[dict] | None = None,
    ) -> list:
        """Build message list for LLM."""
        messages = [SystemMessage(content=system_prompt)]

        if conversation_history:
            for msg in conversation_history:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))

        messages.append(HumanMessage(content=user_message))
        return messages

    def _extract_text(self, content) -> str:
        """Extract text from response content (handles both string and list formats)."""
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            # Responses API format - extract text from content blocks
            texts = []
            for block in content:
                if isinstance(block, dict):
                    # Try different possible text keys
                    text = block.get("text") or block.get("content") or ""
                    texts.append(text)
                elif hasattr(block, "text"):
                    texts.append(block.text)
                else:
                    texts.append(str(block))
            return "".join(texts)
        return str(content) if content else ""

    async def _invoke_llm_stream(self, messages: list, user_id: str | None = None):
        """
        Stream LLM response tokens with rate limiting.

        Args:
            messages: List of messages to send to the LLM
            user_id: Optional user ID for per-user rate limiting

        Yields:
            Text chunks as they arrive from the LLM
        """
        # Check rate limit before streaming
        await self._rate_limiter.acquire(user_id)

        async for chunk in self.llm.astream(messages):
            text = self._extract_chunk_text(chunk)
            if text:
                yield text

    def _extract_chunk_text(self, chunk) -> str:
        """Extract text from a streaming chunk."""
        # Handle different chunk formats
        if hasattr(chunk, "content"):
            content = chunk.content
            if isinstance(content, str):
                return content
            if isinstance(content, list):
                texts = []
                for block in content:
                    if isinstance(block, dict):
                        text = block.get("text") or block.get("content") or ""
                        texts.append(text)
                    elif hasattr(block, "text"):
                        texts.append(block.text)
                return "".join(texts)
        return ""
