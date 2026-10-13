"""Algorithm correctness tests against textbook scheduling examples."""

from __future__ import annotations

import pytest

from engine.models import Process
from engine.simulator import simulate


def gantt_tuples(result):
    return [(s.pid, s.start, s.end) for s in result.gantt()]


def test_fcfs_convoy_effect():
    workload = [
        Process("P1", 0, 24, 3),
        Process("P2", 0, 3, 3),
        Process("P3", 0, 3, 3),
    ]
    result = simulate(workload, "fcfs")
    m = result.metrics
    assert m.avg_waiting == pytest.approx(17.0)
    assert m.avg_turnaround == pytest.approx(27.0)
    assert m.avg_response == pytest.approx(17.0)
    assert m.context_switches == 2
    assert gantt_tuples(result) == [("P1", 0, 24), ("P2", 24, 27), ("P3", 27, 30)]


def test_sjf_beats_fcfs_on_waiting():
    # Classic Operating System Concepts set (all arrive at 0).
    workload = [
        Process("P1", 0, 6, 3),
        Process("P2", 0, 8, 3),
        Process("P3", 0, 7, 3),
        Process("P4", 0, 3, 3),
    ]
    result = simulate(workload, "sjf")
    m = result.metrics
    assert m.avg_waiting == pytest.approx(7.0)
    assert m.avg_turnaround == pytest.approx(13.0)
    assert gantt_tuples(result) == [
        ("P4", 0, 3),
        ("P1", 3, 9),
        ("P3", 9, 16),
        ("P2", 16, 24),
    ]


def test_srtf_textbook_trace():
    workload = [
        Process("P1", 0, 8, 3),
        Process("P2", 1, 4, 3),
        Process("P3", 2, 9, 3),
        Process("P4", 3, 5, 3),
    ]
    result = simulate(workload, "srtf")
    m = result.metrics
    assert m.avg_waiting == pytest.approx(6.5)
    assert m.avg_turnaround == pytest.approx(13.0)
    assert gantt_tuples(result) == [
        ("P1", 0, 1),
        ("P2", 1, 5),
        ("P4", 5, 10),
        ("P1", 10, 17),
        ("P3", 17, 26),
    ]


def test_priority_preempts_lower_priority():
    workload = [
        Process("P1", 0, 10, 1),
        Process("P2", 2, 5, 5),
    ]
    result = simulate(workload, "priority")
    m = result.metrics
    assert m.avg_waiting == pytest.approx(2.5)
    assert m.avg_turnaround == pytest.approx(10.0)
    assert m.avg_response == pytest.approx(0.0)
    assert gantt_tuples(result) == [("P1", 0, 2), ("P2", 2, 7), ("P1", 7, 15)]


def test_round_robin_fixed_quantum():
    workload = [
        Process("P1", 0, 24, 3),
        Process("P2", 0, 3, 3),
        Process("P3", 0, 3, 3),
    ]
    from engine.config import SimConfig

    result = simulate(workload, "rr", SimConfig(fixed_quantum=4))
    m = result.metrics
    assert m.avg_waiting == pytest.approx(17 / 3)
    assert m.avg_turnaround == pytest.approx(47 / 3)
    assert m.avg_response == pytest.approx(11 / 3)
    assert gantt_tuples(result) == [
        ("P1", 0, 4),
        ("P2", 4, 7),
        ("P3", 7, 10),
        ("P1", 10, 30),
    ]


def test_idle_gap_and_cpu_utilization():
    result = simulate([Process("P1", 5, 3, 3)], "fcfs")
    m = result.metrics
    assert m.cpu_utilization == pytest.approx(3 / 8)
    assert m.makespan == 8
    assert gantt_tuples(result) == [(None, 0, 5), ("P1", 5, 8)]


def test_determinism():
    workload = [
        Process("P1", 0, 7, 2),
        Process("P2", 2, 4, 5),
        Process("P3", 4, 1, 1),
    ]
    first = simulate(workload, "srtf").metrics
    second = simulate(workload, "srtf").metrics
    assert first == second
