"""Aggregate metric computation (FR7)."""

from __future__ import annotations

from .models import Metrics, ProcessState


def compute_metrics(
    processes: list[ProcessState],
    context_switches: int,
    algorithm_switches: int,
) -> Metrics:
    """Aggregate per-process timings into the reported metrics.

    All processes must have finished; waiting/turnaround/response follow the
    standard textbook definitions.
    """
    if not processes:
        return Metrics(0.0, 0.0, 0.0, 0.0, context_switches, algorithm_switches, 0, 0)

    waiting: list[int] = []
    turnaround: list[int] = []
    response: list[int] = []
    finish_times: list[int] = []
    busy = 0

    for p in processes:
        if p.finish is None or p.first_run is None:
            raise ValueError(f"process {p.pid} did not complete")
        busy += p.burst
        waiting.append(p.finish - p.arrival - p.burst)
        turnaround.append(p.finish - p.arrival)
        response.append(p.first_run - p.arrival)
        finish_times.append(p.finish)

    makespan = max(finish_times)
    cpu_util = busy / makespan if makespan > 0 else 1.0

    n = len(processes)
    return Metrics(
        avg_waiting=sum(waiting) / n,
        avg_turnaround=sum(turnaround) / n,
        avg_response=sum(response) / n,
        cpu_utilization=cpu_util,
        context_switches=context_switches,
        algorithm_switches=algorithm_switches,
        max_waiting=max(waiting),
        makespan=makespan,
    )
