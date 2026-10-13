"""AKT-Arbiter rule and safeguard tests (FR4, FR5)."""

from __future__ import annotations

import pytest

from engine.arbiter import AKTArbiter
from engine.config import SimConfig
from engine.models import Process, ProcessState
from engine.simulator import simulate_adaptive


def ps(pid, remaining, priority=1, waited=0):
    s = ProcessState(Process(pid, 0, remaining, priority))
    s.remaining = remaining
    s.waited = waited
    s.released = True
    return s


def balanced():
    return [ps("P1", 5), ps("P2", 5), ps("P3", 5)]


def skewed():
    return [ps("P1", 20), ps("P2", 1), ps("P3", 1), ps("P4", 1)]


def test_rule1_urgent_picks_priority():
    arb = AKTArbiter()
    d = arb.decide(0, None, [ps("P1", 10, priority=5), ps("P2", 10, priority=1)], "")
    assert d.algorithm == "priority"
    assert d.urgent is True


def test_rule2_skew_picks_srtf():
    arb = AKTArbiter()
    d = arb.decide(0, None, skewed(), "")
    assert d.algorithm == "srtf"
    assert "skew" in d.reason


def test_rule3_balanced_picks_round_robin():
    arb = AKTArbiter()
    d = arb.decide(0, None, balanced(), "")
    assert d.algorithm == "rr"
    assert "balanced" in d.reason


def test_cooldown_blocks_a_quick_switch():
    arb = AKTArbiter(SimConfig(cooldown=8))
    arb.decide(0, None, skewed(), "")
    arb.decide(0, None, balanced(), "srtf")  # switches to rr, last_switch = 0
    d = arb.decide(2, None, skewed(), "rr")  # wants srtf but only 2 ms elapsed
    assert d.algorithm == "rr"
    assert "cooldown" in d.reason


def test_cooldown_lapses_allow_switch():
    arb = AKTArbiter(SimConfig(cooldown=8))
    arb.decide(0, None, skewed(), "")
    arb.decide(0, None, balanced(), "srtf")  # -> rr at t=0
    d = arb.decide(8, None, skewed(), "rr")  # 8 ms elapsed
    assert d.algorithm == "srtf"


def test_aging_forces_round_robin():
    arb = AKTArbiter()
    d = arb.decide(0, None, [ps("P1", 10, waited=100)], "")
    assert d.algorithm == "rr"
    assert "aging" in d.reason


def test_priority_cap_lets_aging_interrupt():
    arb = AKTArbiter(SimConfig(priority_cap=20))
    arb.decide(0, None, [ps("P1", 50, priority=5), ps("P2", 50, priority=1)], "")
    early = arb.decide(10, None, [ps("P2", 10, priority=5, waited=40)], "priority")
    assert early.algorithm == "priority"  # within cap, urgent still wins

    late = arb.decide(25, None, [ps("P2", 10, priority=5, waited=40)], "priority")
    assert late.algorithm == "rr"  # past cap, aging check runs
    assert "aging" in late.reason


def test_adaptive_integration_switches_and_finishes():
    workload = [
        Process("P1", 0, 10, 1),
        Process("P2", 0, 10, 1),
        Process("P3", 0, 10, 1),
        Process("P4", 3, 2, 5),
        Process("P5", 6, 20, 1),
    ]
    result = simulate_adaptive(workload)
    m = result.metrics
    assert m.algorithm_switches >= 1
    assert m.cpu_utilization < 1.0  # switch penalty charged
    assert all(p.finish is not None for p in result.processes)
    assert any(d.switched for d in result.decisions)


def test_adaptive_is_deterministic():
    workload = [Process("P1", 0, 7, 3), Process("P2", 2, 4, 5), Process("P3", 4, 9, 1)]
    assert simulate_adaptive(workload).metrics == simulate_adaptive(workload).metrics
