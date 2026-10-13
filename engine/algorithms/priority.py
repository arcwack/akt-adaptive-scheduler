"""Priority scheduling: preemptive, highest priority (5) first."""

from __future__ import annotations

from ..models import ProcessState
from .base import Algorithm, ScheduleContext


class Priority(Algorithm):
    key = "priority"
    label = "Priority"
    preemptive = True

    def pick(self, ctx: ScheduleContext) -> ProcessState | None:
        contenders = ctx.contenders()
        if not contenders:
            return None
        return sorted(
            contenders,
            key=lambda p: (-p.priority, p.arrival, p.pid),
        )[0]
