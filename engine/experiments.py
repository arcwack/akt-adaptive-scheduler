"""Experiment runners for the report (cooldown sweep, quantum comparison)."""

from __future__ import annotations

from dataclasses import replace

from .config import SimConfig
from .models import Process
from .simulator import simulate, simulate_adaptive

DEFAULT_COOLDOWNS = [0, 4, 8, 16]
DEFAULT_QUANTA = [2, 4, 8]
TRADEOFF_QUANTA = list(range(1, 17))


def _metrics_row(metrics) -> dict:
    return {
        "avg_waiting": metrics.avg_waiting,
        "avg_turnaround": metrics.avg_turnaround,
        "avg_response": metrics.avg_response,
        "context_switches": metrics.context_switches,
        "algorithm_switches": metrics.algorithm_switches,
        "max_waiting": metrics.max_waiting,
    }


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
        rows.append({"cooldown": value, **_metrics_row(metrics)})
    return rows


def quantum_experiment(
    processes: list[Process],
    config: SimConfig | None = None,
    quanta: list[int] | None = None,
) -> list[dict]:
    """Compare Round Robin with fixed quanta against the dynamic quantum.

    Reports any workload where a fixed quantum beats the dynamic one, as the
    PRD requires.
    """
    base = config or SimConfig()
    values = quanta if quanta is not None else list(DEFAULT_QUANTA)

    rows: list[dict] = []
    for value in values:
        metrics = simulate(processes, "rr", replace(base, fixed_quantum=value)).metrics
        rows.append(
            {
                "label": f"fixed {value} ms",
                "quantum": value,
                "dynamic": False,
                **_metrics_row(metrics),
            }
        )
    dynamic = simulate(processes, "rr", replace(base, fixed_quantum=None)).metrics
    rows.append(
        {
            "label": "dynamic",
            "quantum": None,
            "dynamic": True,
            **_metrics_row(dynamic),
        }
    )
    return rows


def quantum_tradeoff(
    processes: list[Process],
    config: SimConfig | None = None,
    quanta: list[int] | None = None,
) -> list[dict]:
    """Round Robin at every fixed quantum 1..16 plus dynamic.

    Each point is (context switches, waiting/response/turnaround) so the
    trade-off can be plotted with context switches on x.
    """
    base = config or SimConfig()
    values = quanta if quanta is not None else list(TRADEOFF_QUANTA)

    points: list[dict] = []
    for value in values:
        metrics = simulate(processes, "rr", replace(base, fixed_quantum=value)).metrics
        points.append(
            {
                "quantum": value,
                "dynamic": False,
                "context_switches": metrics.context_switches,
                "avg_waiting": metrics.avg_waiting,
                "avg_response": metrics.avg_response,
                "avg_turnaround": metrics.avg_turnaround,
            }
        )
    dynamic = simulate(processes, "rr", replace(base, fixed_quantum=None)).metrics
    points.append(
        {
            "quantum": None,
            "dynamic": True,
            "context_switches": dynamic.context_switches,
            "avg_waiting": dynamic.avg_waiting,
            "avg_response": dynamic.avg_response,
            "avg_turnaround": dynamic.avg_turnaround,
        }
    )
    return points
