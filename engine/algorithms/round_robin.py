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
        self.rounds: list[dict] = []

    def pick(self, ctx: ScheduleContext) -> ProcessState | None:
        if ctx.running is not None and ctx.quantum_left and ctx.quantum_left > 0:
            return ctx.running
        if not ctx.ready:
            return ctx.running
        return ctx.ready[0]

    def quantum(self, ready: list[ProcessState], now: int) -> int | None:
        remaining = [p.remaining for p in ready] or [self.config.quantum_min]
        med = median(remaining)
        fixed = self.config.fixed_quantum
        if fixed is not None:
            q = fixed
        else:
            q = max(self.config.quantum_min, min(self.config.quantum_max, round(med)))
        self.rounds.append(
            {
                "round": len(self.rounds) + 1,
                "time": now,
                "remaining": list(remaining),
                "median": med,
                "quantum": q,
                "dynamic": fixed is None,
            }
        )
        return q
