"""Turn engine results into JSON-friendly dictionaries."""

from __future__ import annotations

from dataclasses import asdict

from engine.models import ProcessState, RunResult


def _process(p: ProcessState, finish: int) -> dict:
    return {
        "pid": p.pid,
        "arrival": p.arrival,
        "burst": p.burst,
        "priority": p.priority,
        "first_run": p.first_run,
        "finish": finish,
        "waiting": finish - p.arrival - p.burst,
        "turnaround": finish - p.arrival,
        "response": (p.first_run or 0) - p.arrival,
    }


def serialize_result(result: RunResult) -> dict:
    return {
        "algorithm": result.algorithm,
        "gantt": [asdict(s) for s in result.gantt()],
        "metrics": asdict(result.metrics),
        "decisions": [asdict(d) for d in result.decisions],
        "processes": [
            _process(p, p.finish) for p in result.processes if p.finish is not None
        ],
        "frames": [asdict(f) for f in result.frames],
        "rounds": result.rounds,
    }
