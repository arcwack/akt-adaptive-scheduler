"""Ready-queue statistics used by the AKT-Arbiter (FR3)."""

from __future__ import annotations

import math
from dataclasses import dataclass

from .models import ProcessState


@dataclass(frozen=True)
class QueueStats:
    n: int
    mean: float
    std: float
    cv: float
    max_wait: int
    max_priority: int


def queue_stats(states: list[ProcessState]) -> QueueStats:
    """Compute mean/std/CV of remaining bursts plus waiting extremes.

    Linear in the number of ready processes (performance NFR). An empty queue
    reports zeroed statistics so callers never divide by zero.
    """
    n = len(states)
    if n == 0:
        return QueueStats(0, 0.0, 0.0, 0.0, 0, 0)

    remaining = [p.remaining for p in states]
    mean = sum(remaining) / n
    variance = sum((r - mean) ** 2 for r in remaining) / n
    std = math.sqrt(variance)
    cv = std / mean if mean > 0 else 0.0

    return QueueStats(
        n=n,
        mean=mean,
        std=std,
        cv=cv,
        max_wait=max(p.waited for p in states),
        max_priority=max(p.priority for p in states),
    )
