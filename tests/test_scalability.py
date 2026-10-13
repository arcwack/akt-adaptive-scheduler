"""Scalability: the NFR asks for at least 50 processes without slowdown."""

from __future__ import annotations

import time

from engine.algorithms import FIXED_ALGORITHMS
from engine.models import Process
from engine.simulator import simulate, simulate_adaptive


def workload(count: int) -> list[Process]:
    return [Process(f"P{i + 1}", i // 5, 1 + (i % 10), 3) for i in range(count)]


def test_adaptive_handles_50_processes_quickly():
    processes = workload(50)
    start = time.perf_counter()
    result = simulate_adaptive(processes)
    elapsed = time.perf_counter() - start

    assert all(p.finish is not None for p in result.processes)
    assert len(result.frames) == result.metrics.makespan
    assert elapsed < 0.5


def test_every_algorithm_completes_50_processes():
    processes = workload(50)
    for key in FIXED_ALGORITHMS:
        result = simulate(processes, key)
        assert all(p.finish is not None for p in result.processes), key
