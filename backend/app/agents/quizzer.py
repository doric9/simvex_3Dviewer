"""Quizzer Agent - Generates quizzes and provides feedback."""

import json
import re

from app.agents.base import BaseAgent
from app.agents.prompts import (
    QUIZZER_SYSTEM_PROMPT,
    QUIZ_GENERATION_PROMPT,
    QUIZ_FEEDBACK_PROMPT,
    QUIZ_TOPICS_INSTRUCTION,
    QUIZ_RAG_CONTEXT_PROMPT,
)
from app.data.machinery import get_machinery_context
from app.data.quiz_bank import get_questions_by_machinery


class QuizzerAgent(BaseAgent):
    """Agent that generates quizzes and provides feedback in Korean."""

    def __init__(self):
        # Higher token limit for quiz generation (needs reasoning + JSON output)
        super().__init__(temperature=0.7)
        # Override max_tokens for quiz generation
        self.llm.max_tokens = 2000

    async def invoke(self, *args, **kwargs) -> str:
        """Generic invoke - use specific methods instead."""
        raise NotImplementedError("Use generate_quiz or grade_answer methods")

    async def generate_quiz(
        self,
        machinery_id: str,
        count: int = 3,
        quiz_accuracy: float = 0.5,
        exclude_ids: list[str] | None = None,
        topics_learned: list[str] | None = None,
        user_id: str | None = None,
        rag_context: str | None = None,
    ) -> list[dict]:
        """
        Generate quiz questions for a machinery.

        Args:
            machinery_id: The machinery to generate questions for
            count: Number of questions to generate
            quiz_accuracy: User's current accuracy (0-1) for adaptive difficulty
            exclude_ids: Question IDs to exclude (already answered)
            topics_learned: Topics the user has discussed with the Explainer
            user_id: Optional user ID for rate limiting

        Returns:
            List of quiz questions
        """
        exclude_ids = exclude_ids or []
        topics_learned = topics_learned or []

        # Get questions from the quiz bank
        bank_questions = get_questions_by_machinery(machinery_id)
        available_bank_questions = [
            q for q in bank_questions if q["id"] not in exclude_ids
        ]

        questions = []

        # If user has learned topics, prioritize relevant bank questions
        if topics_learned:
            # Sort bank questions: topic-relevant ones first
            relevant, other = self._split_by_topic_relevance(
                available_bank_questions, topics_learned
            )
            available_bank_questions = relevant + other

        # Use bank questions first
        for q in available_bank_questions[:count]:
            questions.append({
                "id": q["id"],
                "question": q["question"],
                "options": q["options"],
                "correct_answer": q["correct_answer"],
                "machinery_id": machinery_id,
            })

        # If we need more questions, generate with LLM
        remaining = count - len(questions)
        if remaining > 0:
            generated = await self._generate_with_llm(
                machinery_id, remaining, quiz_accuracy, topics_learned, user_id, rag_context
            )
            questions.extend(generated)

        return questions[:count]

    def _split_by_topic_relevance(
        self, questions: list[dict], topics: list[str]
    ) -> tuple[list[dict], list[dict]]:
        """Split questions into topic-relevant and other."""
        relevant = []
        other = []
        topics_lower = [t.lower() for t in topics]

        for q in questions:
            question_text = q["question"].lower()
            options_text = " ".join(q["options"]).lower()
            combined = f"{question_text} {options_text}"

            # Check if any topic appears in the question
            if any(topic in combined for topic in topics_lower):
                relevant.append(q)
            else:
                other.append(q)

        return relevant, other

    async def _generate_with_llm(
        self,
        machinery_id: str,
        count: int,
        quiz_accuracy: float,
        topics_learned: list[str] | None = None,
        user_id: str | None = None,
        rag_context: str | None = None,
    ) -> list[dict]:
        """Generate questions using LLM, focused on learned topics."""
        # Determine difficulty based on accuracy
        if quiz_accuracy < 0.4:
            difficulty = "쉬움 (기본 개념 위주)"
        elif quiz_accuracy < 0.7:
            difficulty = "보통 (응용 문제 포함)"
        else:
            difficulty = "어려움 (심화 문제)"

        machinery_context = get_machinery_context(machinery_id)

        # Add topics instruction if user has learned topics
        topics_instruction = ""
        if topics_learned:
            topics_instruction = QUIZ_TOPICS_INSTRUCTION.format(
                topics=", ".join(topics_learned)
            )

        prompt = QUIZ_GENERATION_PROMPT.format(
            count=count,
            machinery_context=machinery_context,
            difficulty=difficulty,
            topics_instruction=topics_instruction,
        )

        # Append RAG context for richer question generation
        if rag_context:
            prompt += QUIZ_RAG_CONTEXT_PROMPT.format(rag_context=rag_context)

        messages = self._build_messages(
            system_prompt=QUIZZER_SYSTEM_PROMPT,
            user_message=prompt,
        )

        response = await self._invoke_llm(messages, user_id=user_id)

        # Parse JSON response - handle both string and Responses API formats
        try:
            content = ""
            if hasattr(response, 'text') and response.text:
                content = response.text
            elif hasattr(response, 'content'):
                content = self._extract_text(response.content)

            json_match = re.search(r'\[[\s\S]*\]', content)
            if json_match:
                questions = json.loads(json_match.group())
                for i, q in enumerate(questions):
                    q["id"] = f"gen_{machinery_id}_{i}_{hash(q['question']) % 10000}"
                    q["machinery_id"] = machinery_id
                return questions
        except (json.JSONDecodeError, Exception):
            pass

        return []

    async def grade_answer_stream(
        self,
        question: str,
        options: list[str],
        selected_answer: int,
        correct_answer: int,
        user_id: str | None = None,
    ):
        """
        Stream grading feedback token-by-token.

        Same prompt as grade_answer() but uses streaming with lower max_tokens.

        Yields:
            Text chunks as they arrive from the LLM
        """
        is_correct = selected_answer == correct_answer
        result = "정답" if is_correct else "오답"

        prompt = QUIZ_FEEDBACK_PROMPT.format(
            question=question,
            options=", ".join(f"{i}. {opt}" for i, opt in enumerate(options)),
            selected_answer=selected_answer,
            selected_text=options[selected_answer] if 0 <= selected_answer < len(options) else "없음",
            correct_answer=correct_answer,
            correct_text=options[correct_answer] if 0 <= correct_answer < len(options) else "없음",
            result=result,
        )

        messages = self._build_messages(
            system_prompt=QUIZZER_SYSTEM_PROMPT,
            user_message=prompt,
        )

        # Lower max_tokens for feedback (prompt asks for 100-150 chars)
        original_max_tokens = self.llm.max_tokens
        self.llm.max_tokens = 150
        try:
            async for chunk in self._invoke_llm_stream(messages, user_id=user_id):
                yield chunk
        finally:
            self.llm.max_tokens = original_max_tokens

    async def grade_answer(
        self,
        question: str,
        options: list[str],
        selected_answer: int,
        correct_answer: int,
        user_id: str | None = None,
    ) -> str:
        """
        Grade an answer and provide feedback.

        Args:
            question: The quiz question
            options: List of answer options
            selected_answer: Index of the selected answer
            correct_answer: Index of the correct answer
            user_id: Optional user ID for rate limiting

        Returns:
            Feedback string in Korean
        """
        is_correct = selected_answer == correct_answer
        result = "정답" if is_correct else "오답"

        prompt = QUIZ_FEEDBACK_PROMPT.format(
            question=question,
            options=", ".join(f"{i}. {opt}" for i, opt in enumerate(options)),
            selected_answer=selected_answer,
            selected_text=options[selected_answer] if 0 <= selected_answer < len(options) else "없음",
            correct_answer=correct_answer,
            correct_text=options[correct_answer] if 0 <= correct_answer < len(options) else "없음",
            result=result,
        )

        messages = self._build_messages(
            system_prompt=QUIZZER_SYSTEM_PROMPT,
            user_message=prompt,
        )

        # Use rate-limited LLM invocation
        response = await self._invoke_llm(messages, user_id=user_id)
        feedback = self._extract_text(response.content)
        # Fallback if feedback extraction fails
        if not feedback:
            if is_correct:
                feedback = "정답입니다! 잘 하셨습니다."
            else:
                feedback = f"오답입니다. 정답은 {correct_answer + 1}번 '{options[correct_answer]}'입니다."
        return feedback
