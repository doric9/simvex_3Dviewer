"""Explainer Agent - Explains machinery concepts to students."""

from app.agents.base import BaseAgent
from app.agents.prompts import get_explainer_prompt, EXPLAINER_BASE_PROMPT, RAG_CONTEXT_PROMPT
from app.data.machinery import get_machinery_context


class ExplainerAgent(BaseAgent):
    """Agent that explains machinery concepts to students in Korean."""

    def __init__(self):
        super().__init__(temperature=0.7)

    async def invoke(
        self,
        machinery_id: str,
        user_message: str,
        conversation_history: list[dict] | None = None,
        user_id: str | None = None,
        rag_context: str | None = None,
    ) -> tuple[str, list[str]]:
        """
        Explain machinery concepts to the user.

        Args:
            machinery_id: The machinery ID to explain
            user_message: The user's message
            conversation_history: Optional conversation history
            user_id: Optional user ID for rate limiting
            rag_context: Optional RAG context from knowledge base

        Returns:
            tuple: (response_text, topics_discussed)
        """
        # Get machinery-specific context
        machinery_context = get_machinery_context(machinery_id)
        base_prompt = get_explainer_prompt(machinery_id)

        # Build full system prompt with context
        system_prompt = f"{base_prompt}\n\n{EXPLAINER_BASE_PROMPT.format(machinery_context=machinery_context)}"

        # Append RAG context if available
        if rag_context:
            system_prompt += RAG_CONTEXT_PROMPT.format(rag_context=rag_context)

        # Build messages
        messages = self._build_messages(
            system_prompt=system_prompt,
            user_message=user_message,
            conversation_history=conversation_history,
        )

        # Invoke LLM with rate limiting
        response = await self._invoke_llm(messages, user_id=user_id)
        response_text = self._extract_text(response.content)

        # Extract topics discussed from the response
        topics = self._extract_topics(user_message, response_text, machinery_id)

        return response_text, topics

    async def invoke_stream(
        self,
        machinery_id: str,
        user_message: str,
        conversation_history: list[dict] | None = None,
        user_id: str | None = None,
        rag_context: str | None = None,
    ):
        """
        Stream explanation to the user, yielding tokens as they arrive.

        Args:
            machinery_id: The machinery ID to explain
            user_message: The user's message
            conversation_history: Optional conversation history
            user_id: Optional user ID for rate limiting
            rag_context: Optional RAG context from knowledge base

        Yields:
            Text chunks as they arrive from the LLM
        """
        # Get machinery-specific context
        machinery_context = get_machinery_context(machinery_id)
        base_prompt = get_explainer_prompt(machinery_id)

        # Build full system prompt with context
        system_prompt = f"{base_prompt}\n\n{EXPLAINER_BASE_PROMPT.format(machinery_context=machinery_context)}"

        # Append RAG context if available
        if rag_context:
            system_prompt += RAG_CONTEXT_PROMPT.format(rag_context=rag_context)

        # Build messages
        messages = self._build_messages(
            system_prompt=system_prompt,
            user_message=user_message,
            conversation_history=conversation_history,
        )

        # Stream LLM tokens
        async for chunk in self._invoke_llm_stream(messages, user_id=user_id):
            yield chunk

    def _extract_topics(
        self, user_message: str, response: str, machinery_id: str
    ) -> list[str]:
        """Extract topics discussed from the conversation."""
        topics = []

        # Topic keywords for each machinery type
        topic_keywords = {
            "V4_Engine": [
                "피스톤", "크랭크샤프트", "연결봉", "4행정", "흡입", "압축", "폭발", "배기",
                "실린더", "점화", "밸브", "연료", "연소"
            ],
            "Drone": [
                "프로펠러", "양력", "모터", "비행", "자세제어", "쿼드콥터", "회전",
                "추진력", "호버링", "기울기"
            ],
            "Suspension": [
                "스프링", "댐퍼", "충격흡수", "승차감", "접지력", "안정성",
                "진동", "감쇠"
            ],
            "Leaf Spring": [
                "판스프링", "하중", "내구성", "트럭", "굽힘", "탄성",
                "클램프", "분산"
            ],
            "Machine Vice": [
                "바이스", "나사", "조", "고정", "스핀들", "클램프",
                "공작물", "가이드"
            ],
            "Robot Arm": [
                "관절", "자유도", "모터", "링크", "엔드이펙터", "제어",
                "6축", "회전", "위치제어"
            ],
            "Robot Gripper": [
                "그리퍼", "기어", "링크", "집게", "개폐", "힘제어",
                "평행", "센서"
            ],
        }

        keywords = topic_keywords.get(machinery_id, [])
        combined_text = f"{user_message} {response}".lower()

        for keyword in keywords:
            if keyword.lower() in combined_text:
                topics.append(keyword)

        return list(set(topics))  # Remove duplicates
