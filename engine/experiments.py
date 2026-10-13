"""Experiment runners for the report (cooldown sweep, quantum comparison)."""

from __future__ import annotations

from dataclasses import replace

from .config import SimConfig
from .models import Process
from .simulator import simulate_adaptive

DEFAULT_COOLDOWNS = [0, 4, 8, 16]


def cooldown_sweep(
    processes: list[Process],
    config: SimConfig | None = None,
    cooldowns: list[int] | None = None,
) -> list[dict]:
    """Run the adaptive scheduler at several cooldowns on one workload.

    Demonstrates the thrashing limitation: at cooldown 0 the arbiter flips
    often; a longer cooldown cuts switches but reacts more slowly.
    """
    base = config or SimConfig()
    values = cooldowns if cooldowns is not None else list(DEFAULT_COOLDOWNS)

    rows: list[dict] = []
    for value in values:
        metrics = simulate_adaptive(processes, replace(base, cooldown=value)).metrics
        rows.append(
            {
                "cooldown": value,
                "algorithm_switches": metrics.algorithm_switches,
                "context_switches": metrics.context_switches,
                "avg_waiting": metrics.avg_waiting,
                "avg_turnaround": metrics.avg_turnaround,
            }
        )
    return rows
