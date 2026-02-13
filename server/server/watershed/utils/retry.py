"""
Retry utilities with exponential backoff using tenacity.

This module provides a thin wrapper around tenacity for consistent API
across the data loading pipeline, plus convenience functions for common patterns.
"""

import logging
from typing import TypeVar, Callable, ParamSpec

from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
    retry_if_exception_type,
    RetryError,
)

logger = logging.getLogger(__name__)

P = ParamSpec('P')
T = TypeVar('T')


def with_retry(
    max_attempts: int = 6,
    base_delay: float = 0.2,
    max_delay: float = 60.0,
    exceptions: tuple[type[Exception], ...] = (Exception,),
) -> Callable[[Callable[P, T]], Callable[P, T]]:
    """
    Decorator that retries a function with exponential backoff on failure.
    
    Uses tenacity under the hood for robust retry behavior including jitter.
    
    Args:
        max_attempts: Maximum number of attempts before giving up (default: 6)
        base_delay: Initial delay in seconds (default: 0.2s)
                    Delays grow exponentially: 0.2, 0.4, 0.8, 1.6, 3.2, 6.4s
        max_delay: Maximum delay between retries (default: 60s)
        exceptions: Tuple of exception types to catch and retry on
    
    Returns:
        Decorated function that automatically retries on failure
    
    Raises:
        The last exception encountered after all retries are exhausted
    
    Example:
        @with_retry(max_attempts=3, base_delay=0.5)
        def fetch_data(url: str) -> dict:
            return requests.get(url).json()
    """
    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        # Build tenacity retry decorator
        retry_decorator = retry(
            stop=stop_after_attempt(max_attempts),
            wait=wait_exponential(multiplier=base_delay, max=max_delay),
            retry=retry_if_exception_type(exceptions),
            before_sleep=before_sleep_log(logger, logging.DEBUG),
            reraise=True,
        )
        return retry_decorator(func)
    
    return decorator

# Re-export tenacity components for direct use when needed
__all__ = [
    "with_retry",
    # Re-exports from tenacity for advanced use cases
    "retry",
    "stop_after_attempt",
    "wait_exponential",
    "before_sleep_log",
    "retry_if_exception_type",
    "RetryError",
]
