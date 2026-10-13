"""Tick-by-tick scheduling simulator.

The simulator owns all timing mechanics; algorithms and the policy only make
choices. One tick == one millisecond, matching the PRD's thresholds.
"""

from __future__ import annotations

from .algorithms import ALGORITHM_LABELS, build_algorithm
from .config import SimConfig
from .metrics import compute_metrics
from .models import (
    DecisionRecord,
    Process,
    ProcessState,
    RunResult,
    TimelineSlice,
)
from .policy import FixedPolicy, Policy
from .algorithms.base import ScheduleContext


class Simulator:
    def __init__(
        self,
        processes: list[Process],
        policy: Policy,
        config: SimConfig | None = None,
    ) -> None:
        self.processes = processes
        self.policy = policy
        self.config = config or SimConfig()

    def run(self) -> RunResult:
        states = [ProcessState(p) for p in self.processes]
        ready: list[ProcessState] = []
        running: ProcessState | None = None
        quantum_left: int | None = None
        last_pid: str | None = None
        context_switches = 0
        algorithm_switches = 0
        timeline: list[TimelineSlice] = []

        init = self.policy.decide(0, None, [], "")
        current_key = init.algorithm
        algorithm = build_algorithm(current_key, self.config)
        decisions = [DecisionRecord(0, current_key, init.reason, switched=False)]

        hard_cap = (
            max((p.arrival for p in self.processes), default=0)
            + sum(p.burst for p in self.processes)
            + self.config.switch_penalty * 64
            + 16
        )

        t = 0
        while not all(s.done for s in states):
            if t > hard_cap:
                raise RuntimeError("simulation did not converge")

            self._release(states, ready, t)

            decision = self.policy.decide(t, running, ready, current_key)
            if decision.algorithm != current_key:
                current_key = decision.algorithm
                algorithm = build_algorithm(current_key, self.config)
                algorithm_switches += 1
                quantum_left = None
                decisions.append(
                    DecisionRecord(t, current_key, decision.reason, switched=True)
                )
                t = self._apply_penalty(
                    states, ready, timeline, t, current_key
                )
                continue

            if running is None and not ready:
                timeline.append(TimelineSlice(t, t + 1, None, current_key))
                t += 1
                continue

            ctx = ScheduleContext(t, running, ready, quantum_left)
            chosen = algorithm.pick(ctx)
            if chosen is None:
                timeline.append(TimelineSlice(t, t + 1, None, current_key))
                t += 1
                continue

            if chosen is not running:
                if running is not None:
                    ready.append(running)
                new_quantum = algorithm.quantum(ready, t)
                ready = [s for s in ready if s is not chosen]
                running = chosen
                quantum_left = new_quantum
                if last_pid is not None and last_pid != chosen.pid:
                    context_switches += 1
                last_pid = chosen.pid

            if running.first_run is None:
                running.first_run = t
            running.remaining -= 1
            for s in ready:
                s.waited += 1
            if quantum_left is not None:
                quantum_left -= 1
            timeline.append(TimelineSlice(t, t + 1, running.pid, current_key))

            if running.remaining == 0:
                running.finish = t + 1
                running = None
                quantum_left = None
            t += 1

        metrics = compute_metrics(states, context_switches, algorithm_switches)
        return RunResult(
            algorithm=current_key,
            timeline=timeline,
            decisions=decisions,
            processes=states,
            metrics=metrics,
        )

    @staticmethod
    def _release(
        states: list[ProcessState], ready: list[ProcessState], t: int
    ) -> None:
        for s in states:
            if not s.released and s.arrival <= t:
                s.released = True
                ready.append(s)

    def _apply_penalty(
        self,
        states: list[ProcessState],
        ready: list[ProcessState],
        timeline: list[TimelineSlice],
        t: int,
        algorithm_key: str,
    ) -> int:
        """Charge switch overhead: ready processes wait while the CPU is idle."""
        for _ in range(self.config.switch_penalty):
            for s in ready:
                s.waited += 1
            timeline.append(TimelineSlice(t, t + 1, None, algorithm_key))
            t += 1
            self._release(states, ready, t)
        return t


def simulate(
    processes: list[Process],
    algorithm_key: str,
    config: SimConfig | None = None,
) -> RunResult:
    """Run one fixed algorithm over a workload."""
    policy = FixedPolicy(algorithm_key, ALGORITHM_LABELS.get(algorithm_key, algorithm_key))
    return Simulator(processes, policy, config).run()
