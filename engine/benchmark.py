"""Workload benchmarks: a preset matrix and a seeded random benchmark.

Reuses the existing algorithms and the current threshold settings; it does not
change any scheduling logic.
"""

from __future__ import annotations

import random
from dataclasses import asdict

from .config import SimConfig
from .models import Metrics, Process
from .presets import PRESETS
from .simulator import simulate, simulate_adaptive

ALGORITHMS = ["fcfs", "sjf", "srtf", "rr", "priority", "adaptive"]

MATRIX_WORKLOADS = [
    "Mostly short jobs",
    "Mostly long jobs",
    "Mixed short & long",
    "Bursty arrivals",
    "Urgent processes",
    "CV near threshold",
]

# metric -> which extreme is best
BENCH_METRICS = {
    "avg_waiting": "min",
    "avg_turnaround": "min",
    "avg_response": "min",
    "context_switches": "min",
    "max_waiting": "min",
    "cpu_utilization": "max",
}


def _metrics(processes: list[Process], key: str, config: SimConfig | None) -> Metrics:
    if key == "adaptive":
        return simulate_adaptive(processes, config, record_frames=False).metrics
    return simulate(processes, key, config, record_frames=False).metrics


def matrix_benchmark(config: SimConfig | None = None) -> dict:
    """Six preset workloads x six algorithms, with full metrics per cell."""
    by_name = {preset.name: preset for preset in PRESETS}
    rows = []
    for name in MATRIX_WORKLOADS:
        preset = by_name[name]
        cells = {
            key: asdict(_metrics(preset.processes, key, config)) for key in ALGORITHMS
        }
        rows.append({"workload": name, "cells": cells})
    return {"algorithms": ALGORITHMS, "rows": rows}


def _random_workload(rng: random.Random) -> list[Process]:
    count = rng.randint(4, 12)
    return [
        Process(
            f"P{i + 1}",
            arrival=rng.randint(0, 20),
            burst=rng.randint(1, 20),
            priority=rng.randint(1, 5),
        )
        for i in range(count)
    ]


def random_benchmark(
    count: int = 100,
    seed: int = 42,
    config: SimConfig | None = None,
) -> dict:
    """Mean metrics per algorithm and how often Adaptive is best per metric."""
    rng = random.Random(seed)
    sums = {key: {m: 0.0 for m in BENCH_METRICS} for key in ALGORITHMS}
    best_counts = {m: 0 for m in BENCH_METRICS}

    for _ in range(count):
        workload = _random_workload(rng)
        results = {key: _metrics(workload, key, config) for key in ALGORITHMS}

        for key in ALGORITHMS:
            for metric in BENCH_METRICS:
                sums[key][metric] += getattr(results[key], metric)

        for metric, direction in BENCH_METRICS.items():
            values = {key: getattr(results[key], metric) for key in ALGORITHMS}
            best = min(values.values()) if direction == "min" else max(values.values())
            adaptive = values["adaptive"]
            if direction == "min":
                is_best = adaptive <= best + 1e-9
            else:
                is_best = adaptive >= best - 1e-9
            if is_best:
                best_counts[metric] += 1

    means = {
        key: {metric: sums[key][metric] / count for metric in BENCH_METRICS}
        for key in ALGORITHMS
    }
    adaptive_best = {metric: best_counts[metric] / count for metric in BENCH_METRICS}

    return {
        "count": count,
        "seed": seed,
        "algorithms": ALGORITHMS,
        "metrics": BENCH_METRICS,
        "means": means,
        "adaptive_best": adaptive_best,
    }
