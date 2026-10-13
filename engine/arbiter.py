"""The AKT-Arbiter: a rule-based adaptive algorithm selector.

The arbiter never schedules. It only decides *which* algorithm should schedule
next, using three ordered rules plus safeguards against thrashing and
starvation. It implements the same ``Policy`` interface as ``FixedPolicy`` so
the simulator can treat both identically.
"""

from __future__ import annotations

from .algorithms import ALGORITHM_LABELS
from .config import SimConfig
from .models import ProcessState
from .policy import PolicyDecision
from .workload import QueueStats, queue_stats

PRIORITY = "priority"
SRTF = "srtf"
RR = "rr"
_NEVER = -(10**9)


class AKTArbiter:
    def __init__(self, config: SimConfig | None = None) -> None:
        self.cfg = config or SimConfig()
        self.current: str | None = None
        self.last_switch = _NEVER
        self.priority_since: int | None = None
        self.aging_pending: set[str] | None = None
        self.aging_ended_at = _NEVER

    def decide(
        self,
        now: int,
        running: ProcessState | None,
        ready: list[ProcessState],
        current: str,
    ) -> PolicyDecision:
        stats = queue_stats(ready)
        self._advance_aging(now, running)

        if self.current is None:
            target, reason, urgent, note = self._target(stats, now, ready)
            self._enter(target, now, switched=False)
            return PolicyDecision(target, reason, urgent, note)

        if stats.n == 0:
            return PolicyDecision(
                self.current, f"idle: holding {self._label(self.current)}", False
            )

        target, reason, urgent, note = self._target(stats, now, ready)
        if target == self.current:
            return PolicyDecision(self.current, reason, urgent, note)

        elapsed = now - self.last_switch
        if urgent or elapsed >= self.cfg.cooldown:
            self._enter(target, now, switched=True)
            return PolicyDecision(target, reason, urgent, note)
        return PolicyDecision(
            self.current,
            f"cooldown: kept {self._label(self.current)} ({elapsed}/{self.cfg.cooldown} ms)",
            False,
        )

    def _target(
        self, stats: QueueStats, now: int, ready: list[ProcessState]
    ) -> tuple[str, str, bool, bool]:
        cfg = self.cfg
        capped = (
            self.current == PRIORITY
            and self.priority_since is not None
            and now - self.priority_since >= cfg.priority_cap
        )

        if self.aging_pending is not None:
            return RR, "aging hold: completing fair cycle", False, False

        aging_eligible = not (self.current == PRIORITY and not capped)
        if (
            aging_eligible
            and stats.n > 0
            and stats.mean > 0
            and stats.max_wait >= cfg.aging_factor * stats.mean
            and now - self.aging_ended_at >= cfg.cooldown
        ):
            pending = {p.pid for p in ready}
            if pending:
                self.aging_pending = pending
                starved = max(ready, key=lambda p: p.waited)
                return (
                    RR,
                    f"aging: {starved.pid} waited {stats.max_wait} ms "
                    f"(>= {cfg.aging_factor} x mean {stats.mean:.1f}); forced Round Robin turn",
                    False,
                    True,
                )

        urgent = stats.max_priority >= cfg.critical_priority
        if urgent and not capped:
            return (
                PRIORITY,
                f"urgent: priority {stats.max_priority} >= {cfg.critical_priority}",
                True,
                False,
            )
        if stats.cv > cfg.skew_threshold:
            return SRTF, f"skew: CV {stats.cv:.2f} > {cfg.skew_threshold}", False, False
        return RR, f"balanced: CV {stats.cv:.2f} <= {cfg.skew_threshold}", False, False

    def _advance_aging(self, now: int, running: ProcessState | None) -> None:
        if self.aging_pending is None:
            return
        if running is not None:
            self.aging_pending.discard(running.pid)
        if not self.aging_pending:
            self.aging_pending = None
            self.aging_ended_at = now

    def _enter(self, target: str, now: int, switched: bool) -> None:
        if switched:
            self.last_switch = now
        self.current = target
        self.priority_since = now if target == PRIORITY else None

    @staticmethod
    def _label(key: str) -> str:
        return ALGORITHM_LABELS.get(key, key)
