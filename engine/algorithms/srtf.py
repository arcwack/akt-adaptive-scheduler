"""Shortest Remaining Time First: preemptive, ordered by remaining burst."""

from __future__ import annotations

from ..models import ProcessState
from .base import Algorithm, ScheduleContext


class SRTF(Algorithm):
    key = "srtf"
    label = "SRTF"
    preemptive = True

    def pick(self, ctx: ScheduleContext) -> ProcessState | None:
        contenders = ctx.contenders()
        if not contenders:
            return None
        return min(contenders, key=lambda p: (p.remaining, p.arrival, p.pid))
