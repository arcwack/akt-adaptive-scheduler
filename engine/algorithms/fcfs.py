"""First-Come, First-Served: non-preemptive, ordered by arrival."""

from __future__ import annotations

from ..models import ProcessState
from .base import Algorithm, ScheduleContext


class FCFS(Algorithm):
    key = "fcfs"
    label = "FCFS"
    preemptive = False

    def pick(self, ctx: ScheduleContext) -> ProcessState | None:
        if ctx.running is not None:
            return ctx.running
        if not ctx.ready:
            return None
        return min(ctx.ready, key=lambda p: (p.arrival, p.pid))
