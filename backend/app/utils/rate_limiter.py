"""Rate limiting for LLM API calls."""

import asyncio
import time
from collections import defaultdict
from functools import lru_cache


class RateLimitExceeded(Exception):
    """Raised when rate limit is exceeded."""

    def __init__(self, message: str = "Rate limit exceeded", retry_after: float = 60.0):
        self.message = message
        self.retry_after = retry_after
        super().__init__(self.message)


class RateLimiter:
    """
    Rate limiter for LLM API calls.

    Features:
    - Global semaphore limiting concurrent LLM calls (default: 5)
    - Per-user sliding window rate limiting (default: 10 calls/minute)
    - Exponential backoff retry (default: 3 attempts)
    """

    def __init__(
        self,
        max_concurrent: int = 5,
        user_limit: int = 10,
        user_window: float = 60.0,
        max_retries: int = 3,
        base_delay: float = 1.0,
    ):
        self.max_concurrent = max_concurrent
        self.user_limit = user_limit
        self.user_window = user_window
        self.max_retries = max_retries
        self.base_delay = base_delay

        # Global semaphore for concurrent calls
        self._semaphore = asyncio.Semaphore(max_concurrent)

        # Per-user call timestamps for sliding window
        self._user_calls: dict[str, list[float]] = defaultdict(list)
        self._lock = asyncio.Lock()

    def _cleanup_user_calls(self, user_id: str, now: float) -> None:
        """Remove expired timestamps from user's call history."""
        cutoff = now - self.user_window
        self._user_calls[user_id] = [
            ts for ts in self._user_calls[user_id] if ts > cutoff
        ]

    async def check_user_limit(self, user_id: str) -> None:
        """
        Check if user is within rate limit.

        Raises:
            RateLimitExceeded: If user has exceeded their rate limit
        """
        if not user_id:
            return

        async with self._lock:
            now = time.time()
            self._cleanup_user_calls(user_id, now)

            if len(self._user_calls[user_id]) >= self.user_limit:
                # Calculate when the oldest call will expire
                oldest = min(self._user_calls[user_id])
                retry_after = (oldest + self.user_window) - now
                raise RateLimitExceeded(
                    f"Rate limit exceeded. Please wait {retry_after:.1f} seconds.",
                    retry_after=max(retry_after, 1.0),
                )

            # Record this call
            self._user_calls[user_id].append(now)

    async def acquire(self, user_id: str = None) -> None:
        """
        Acquire rate limiter slot.

        Args:
            user_id: Optional user ID for per-user limiting

        Raises:
            RateLimitExceeded: If user rate limit exceeded
        """
        await self.check_user_limit(user_id)

    async def execute_with_retry(self, coro_func, user_id: str = None):
        """
        Execute a coroutine with rate limiting and exponential backoff retry.

        Args:
            coro_func: Async function to execute (called fresh each retry)
            user_id: Optional user ID for per-user limiting

        Returns:
            Result of the coroutine

        Raises:
            RateLimitExceeded: If user rate limit exceeded
            Exception: If all retries exhausted
        """
        await self.acquire(user_id)

        last_exception = None

        for attempt in range(self.max_retries):
            try:
                async with self._semaphore:
                    return await coro_func()
            except Exception as e:
                last_exception = e
                error_str = str(e).lower()

                # Check if it's a rate limit error from OpenAI
                if "rate" in error_str and "limit" in error_str:
                    delay = self.base_delay * (2 ** attempt)
                    await asyncio.sleep(delay)
                    continue

                # For other errors, don't retry
                raise

        # All retries exhausted
        raise last_exception


@lru_cache(maxsize=1)
def get_rate_limiter() -> RateLimiter:
    """Get the singleton rate limiter instance."""
    return RateLimiter()
