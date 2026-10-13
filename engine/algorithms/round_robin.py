"""Round Robin: time-sliced, with a fixed or dynamic quantum (FR11)."""

from __future__ import annotations

from statistics import median

from ..config import SimConfig
from ..models import ProcessState
from .base import Algorithm, ScheduleContext


class RoundRobin(Algorithm):
    key = "rr"
    label = "Round Robin"
    preemptive = True

    def __init__(self, config: SimConfig | None = None) -> None:
        self.config = config or SimConfig()

    def pick(self, ctx: ScheduleContext) -> ProcessState | None:
        if ctx.running is not None and ctx.quantum_left and ctx.quantum_left > 0:
            return ctx.running
        if not ctx.ready:
            return ctx.running
        return ctx.ready[0]

    def quantum(self, ready: list[ProcessState], now: int) -> int | None:
        if self.config.fixed_quantum is not None:
            return self.config.fixed_quantum
        remaining = [p.remaining for p in ready] or [self.config.quantum_min]
        q = round(median(remaining))
        return max(self.config.quantum_min, min(self.config.quantum_max, q))
