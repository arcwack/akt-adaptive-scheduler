"""Algorithm registry and factory."""

from __future__ import annotations

from ..config import SimConfig
from .base import Algorithm, ScheduleContext
from .fcfs import FCFS
from .priority import Priority
from .round_robin import RoundRobin
from .sjf import SJF
from .srtf import SRTF

FIXED_ALGORITHMS: dict[str, type[Algorithm]] = {
    FCFS.key: FCFS,
    SJF.key: SJF,
    SRTF.key: SRTF,
    RoundRobin.key: RoundRobin,
    Priority.key: Priority,
}

ALGORITHM_LABELS: dict[str, str] = {
    key: cls.label for key, cls in FIXED_ALGORITHMS.items()
}


def build_algorithm(key: str, config: SimConfig | None = None) -> Algorithm:
    """Instantiate an algorithm by key. Round Robin receives the config so it
    can honour a fixed or dynamic quantum."""
    if key not in FIXED_ALGORITHMS:
        raise KeyError(f"unknown algorithm '{key}'")
    cls = FIXED_ALGORITHMS[key]
    if cls is RoundRobin:
        return RoundRobin(config)
    return cls()


__all__ = [
    "Algorithm",
    "ScheduleContext",
    "FIXED_ALGORITHMS",
    "ALGORITHM_LABELS",
    "build_algorithm",
]
