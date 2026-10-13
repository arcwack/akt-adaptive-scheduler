"""Shared interface for all scheduling algorithms."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

from ..models import ProcessState


@dataclass
class ScheduleContext:
    """Everything an algorithm needs to make one dispatch decision."""

    now: int
    running: ProcessState | None
    ready: list[ProcessState]
    quantum_left: int | None = None

    def contenders(self) -> list[ProcessState]:
        """Ready processes plus the currently running one, if any."""
        if self.running is None:
            return list(self.ready)
        return [self.running, *self.ready]


class Algorithm(ABC):
    """A scheduling policy.

    ``pick`` returns the process that should run on the next time unit, or
    ``None`` when the CPU must idle. The simulator owns all timing mechanics
    (arrivals, countdowns, completion); algorithms only choose.
    """

    key: str
    label: str
    preemptive: bool = False

    @abstractmethod
    def pick(self, ctx: ScheduleContext) -> ProcessState | None:
        raise NotImplementedError

    def quantum(self, ready: list[ProcessState], now: int) -> int | None:
        """Length of the next time slice, or ``None`` if not time-sliced."""
        return None
