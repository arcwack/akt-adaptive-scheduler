"""Command-line runner: compare all fixed algorithms on a workload.

Usage:
    python -m engine.cli
    python -m engine.cli --quantum 4
"""

from __future__ import annotations

import argparse

from .algorithms import ALGORITHM_LABELS, FIXED_ALGORITHMS
from .config import SimConfig
from .models import Process, RunResult
from .simulator import simulate, simulate_adaptive

DEMO_WORKLOAD = [
    Process("P1", arrival=0, burst=8, priority=2),
    Process("P2", arrival=1, burst=4, priority=4),
    Process("P3", arrival=2, burst=9, priority=1),
    Process("P4", arrival=3, burst=5, priority=3),
]

_COLUMNS = [
    ("Waiting", "avg_waiting", 7, "9.2f"),
    ("Turnaround", "avg_turnaround", 10, "12.2f"),
    ("Response", "avg_response", 8, "10.2f"),
    ("CPU%", "cpu_utilization", 6, "8.1f"),
    ("CtxSw", "context_switches", 5, "7d"),
    ("AlgoSw", "algorithm_switches", 6, "8d"),
    ("MaxWait", "max_waiting", 7, "9d"),
]


def render_gantt(result: RunResult) -> str:
    parts = [
        f"{sl.pid or 'idle'}[{sl.start}-{sl.end}]" for sl in result.gantt()
    ]
    return "  ".join(parts)


def render_row(name: str, result: RunResult) -> str:
    m = result.metrics
    cells = []
    for _, attr, _, fmt in _COLUMNS:
        value = getattr(m, attr)
        if attr == "cpu_utilization":
            value *= 100
        cells.append(f"{value:{fmt}}")
    return f"{name:<13}" + "".join(cells)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="AKT scheduler (fixed algorithms)")
    parser.add_argument("--quantum", type=int, default=None, help="fixed RR quantum (ms)")
    args = parser.parse_args(argv)

    config = SimConfig(fixed_quantum=args.quantum)
    header = f"{'Algorithm':<13}" + "".join(
        f"{title:>{width}}" for title, _, width, _ in _COLUMNS
    )

    print("Workload:")
    for p in DEMO_WORKLOAD:
        print(f"  {p.pid}  arrival={p.arrival}  burst={p.burst}  priority={p.priority}")
    print()
    print(header)
    print("-" * len(header))

    for key in FIXED_ALGORITHMS:
        result = simulate(DEMO_WORKLOAD, key, config)
        print(render_row(ALGORITHM_LABELS[key], result))

    print("-" * len(header))
    adaptive = simulate_adaptive(DEMO_WORKLOAD, config)
    print(render_row("Adaptive", adaptive))

    print()
    print("Gantt (Round Robin):")
    print("  " + render_gantt(simulate(DEMO_WORKLOAD, "rr", config)))
    print("Gantt (Adaptive):")
    print("  " + render_gantt(adaptive))
    print("  switches:")
    for d in adaptive.decisions:
        if d.switched:
            print(f"    t={d.time:<3} -> {d.algorithm:<8} {d.reason}")


if __name__ == "__main__":
    main()
