"""Tests for replay frames, noteworthy logging and the cooldown sweep."""

from __future__ import annotations

from engine.config import SimConfig
from engine.experiments import cooldown_sweep, quantum_experiment
from engine.models import Process
from engine.policy import PolicyDecision
from engine.simulator import Simulator, simulate, simulate_adaptive


def test_frames_cover_every_tick():
    result = simulate([Process("P1", 0, 3, 3)], "fcfs")
    assert result.metrics.makespan == 3
    assert [f.time for f in result.frames] == [0, 1, 2]
    assert all(f.running == "P1" for f in result.frames)
    assert all(f.algorithm == "fcfs" for f in result.frames)


def test_adaptive_frames_capture_ready_queue():
    workload = [Process("P1", 0, 5, 3), Process("P2", 2, 3, 3)]
    result = simulate_adaptive(workload)
    at_two = next(f for f in result.frames if f.time == 2)
    assert "P2" in at_two.ready or at_two.running == "P2"


class _NotePolicy:
    """Emits a noteworthy, non-switching decision on the second tick."""

    def __init__(self) -> None:
        self.calls = 0

    def decide(self, now, running, ready, current):
        self.calls += 1
        note = self.calls == 2
        reason = "noteworthy event" if note else "routine"
        return PolicyDecision("fcfs", reason, False, note)


def test_noteworthy_decision_is_logged():
    result = Simulator([Process("P1", 0, 4, 3)], _NotePolicy()).run()
    notes = [d for d in result.decisions if d.reason == "noteworthy event"]
    assert len(notes) == 1
    assert notes[0].switched is False


def test_cooldown_sweep_shape():
    workload = [Process("P1", 0, 6, 3), Process("P2", 1, 2, 3), Process("P3", 2, 8, 3)]
    rows = cooldown_sweep(workload, SimConfig())
    assert [r["cooldown"] for r in rows] == [0, 4, 8, 16]
    for row in rows:
        assert row["algorithm_switches"] >= 0
        assert row["avg_waiting"] >= 0


def test_quantum_experiment_shape():
    workload = [Process("P1", 0, 6, 3), Process("P2", 1, 2, 3), Process("P3", 2, 8, 3)]
    rows = quantum_experiment(workload, SimConfig())
    assert [r["quantum"] for r in rows] == [2, 4, 8, None]
    assert rows[-1]["dynamic"] is True
    assert all(r["avg_response"] >= 0 for r in rows)
