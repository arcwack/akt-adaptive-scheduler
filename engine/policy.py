"""Pluggable algorithm-selection policy.

A policy answers one question at every decision point: *which algorithm should
schedule next?* Phase 1 ships :class:`FixedPolicy`; the AKT-Arbiter is a second
implementation of the same interface.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from .models import ProcessState


@dataclass(frozen=True)
class PolicyDecision:
    algorithm: str
    reason: str
    urgent: bool = False


class Policy(Protocol):
    def decide(
        self,
        now: int,
        running: ProcessState | None,
        ready: list[ProcessState],
        current: str,
    ) -> PolicyDecision: ...


class FixedPolicy:
    """Always selects the same algorithm; used to run the baseline schedules."""

    def __init__(self, key: str, label: str | None = None) -> None:
        self.key = key
        self.label = label or key

    def decide(
        self,
        now: int,
        running: ProcessState | None,
        ready: list[ProcessState],
        current: str,
    ) -> PolicyDecision:
        return PolicyDecision(self.key, f"fixed: {self.label}")
