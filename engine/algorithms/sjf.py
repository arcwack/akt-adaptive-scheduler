"""Shortest Job First: non-preemptive, ordered by burst length."""

from __future__ import annotations

from ..models import ProcessState
from .base import Algorithm, ScheduleContext


class SJF(Algorithm):
    key = "sjf"
    label = "SJF"
    preemptive = False

    def pick(self, ctx: ScheduleContext) -> ProcessState | None:
        if ctx.running is not None:
            return ctx.running
        if not ctx.ready:
            return None
        return min(ctx.ready, key=lambda p: (p.burst, p.arrival, p.pid))
