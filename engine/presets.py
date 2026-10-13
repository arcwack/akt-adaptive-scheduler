"""Ready-made test workloads (PRD workload table), exposed via the API."""

from __future__ import annotations

from dataclasses import dataclass, field

from .models import Process


@dataclass(frozen=True)
class Preset:
    name: str
    processes: list[Process]
    use_priority: bool = True
    config: dict = field(default_factory=dict)


def _p(pid: str, arrival: int, burst: int, priority: int = 3) -> Process:
    return Process(pid, arrival, burst, priority)


PRESETS: list[Preset] = [
    Preset(
        "Thrashing (mixed short+long)",
        use_priority=False,
        processes=[
            _p("P1", 0, 2), _p("P2", 0, 2), _p("P3", 1, 10), _p("P4", 2, 2),
            _p("P5", 3, 10), _p("P6", 4, 2), _p("P7", 5, 10), _p("P8", 6, 2),
        ],
    ),
    Preset(
        "Mixed short & long",
        use_priority=False,
        processes=[
            _p("P1", 0, 20), _p("P2", 1, 2), _p("P3", 2, 18),
            _p("P4", 3, 3), _p("P5", 4, 15), _p("P6", 5, 2),
        ],
    ),
    Preset(
        "Mostly short jobs",
        use_priority=False,
        processes=[
            _p("P1", 0, 1), _p("P2", 1, 2), _p("P3", 2, 1), _p("P4", 3, 3),
            _p("P5", 4, 2), _p("P6", 5, 1), _p("P7", 6, 2), _p("P8", 7, 1),
        ],
    ),
    Preset(
        "Mostly long jobs",
        use_priority=False,
        processes=[
            _p("P1", 0, 20), _p("P2", 1, 15), _p("P3", 2, 18), _p("P4", 3, 12),
        ],
    ),
    Preset(
        "Bursty arrivals",
        use_priority=False,
        processes=[
            _p("P1", 0, 3), _p("P2", 0, 4), _p("P3", 0, 2), _p("P4", 12, 5),
            _p("P5", 12, 3), _p("P6", 13, 4), _p("P7", 25, 2), _p("P8", 25, 6),
        ],
    ),
    Preset(
        "Urgent processes",
        processes=[
            _p("P1", 0, 8), _p("P2", 1, 6), _p("P3", 2, 4, 5),
            _p("P4", 3, 5), _p("P5", 6, 7, 5), _p("P6", 8, 3, 2),
        ],
    ),
    Preset(
        "Uniform jobs",
        use_priority=False,
        processes=[
            _p("P1", 0, 5), _p("P2", 1, 5), _p("P3", 2, 5),
            _p("P4", 3, 5), _p("P5", 4, 5), _p("P6", 5, 5),
        ],
    ),
    Preset(
        "Classic textbook",
        processes=[
            _p("P1", 0, 8, 2), _p("P2", 1, 4, 4),
            _p("P3", 2, 9, 1), _p("P4", 3, 5, 3),
        ],
    ),
]


def serialize_presets() -> list[dict]:
    return [
        {
            "name": preset.name,
            "use_priority": preset.use_priority,
            "config": preset.config,
            "processes": [
                {
                    "pid": p.pid,
                    "arrival": p.arrival,
                    "burst": p.burst,
                    "priority": p.priority,
                }
                for p in preset.processes
            ],
        }
        for preset in PRESETS
    ]
