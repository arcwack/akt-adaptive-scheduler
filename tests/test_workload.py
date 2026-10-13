"""Ready-queue statistics tests (FR3)."""

from __future__ import annotations

import math

import pytest

from engine.models import Process, ProcessState
from engine.workload import queue_stats


def state(pid, remaining, waited=0, priority=3):
    s = ProcessState(Process(pid, 0, max(remaining, 1), priority))
    s.remaining = remaining
    s.waited = waited
    return s


def test_empty_queue_is_zeroed():
    stats = queue_stats([])
    assert stats.n == 0
    assert stats.cv == 0.0


def test_mean_std_cv():
    stats = queue_stats([state("P1", 2), state("P2", 4), state("P3", 6)])
    assert stats.mean == pytest.approx(4.0)
    assert stats.std == pytest.approx(math.sqrt(8 / 3))
    assert stats.cv == pytest.approx(math.sqrt(8 / 3) / 4)


def test_uniform_queue_has_zero_cv():
    stats = queue_stats([state("P1", 5), state("P2", 5), state("P3", 5)])
    assert stats.cv == pytest.approx(0.0)


def test_waiting_and_priority_extremes():
    stats = queue_stats(
        [state("P1", 3, waited=10, priority=1), state("P2", 3, waited=4, priority=5)]
    )
    assert stats.max_wait == 10
    assert stats.max_priority == 5
