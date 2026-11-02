"""Tiny in-memory failed-attempt limiter (single process). Keyed by email or user id."""
import time
from collections import defaultdict

MAX_ATTEMPTS = 5
WINDOW_SECS = 300
_fails: dict[str, list[float]] = defaultdict(list)


def _prune(key: str) -> None:
    cutoff = time.time() - WINDOW_SECS
    _fails[key] = [t for t in _fails[key] if t > cutoff]


def seconds_locked(key: str) -> int:
    _prune(key)
    if len(_fails[key]) < MAX_ATTEMPTS:
        return 0
    return max(1, int(_fails[key][0] + WINDOW_SECS - time.time()))


def record_failure(key: str) -> None:
    _fails[key].append(time.time())


def clear(key: str) -> None:
    _fails.pop(key, None)


def reset() -> None:
    _fails.clear()
