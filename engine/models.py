"""Core data models for the CPU scheduling simulator."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Process:
    """A static process definition supplied by the user (FR1)."""

    pid: str
    arrival: int
    burst: int
    priority: int = 3

    def __post_init__(self) -> None:
        if self.arrival < 0:
            raise ValueError(f"process {self.pid}: arrival must be >= 0")
        if self.burst <= 0:
            raise ValueError(f"process {self.pid}: burst must be > 0")
        if not 1 <= self.priority <= 5:
            raise ValueError(f"process {self.pid}: priority must be in 1..5")


@dataclass
class ProcessState:
    """Mutable per-run state for a process being scheduled."""

    process: Process
    remaining: int = 0
    first_run: int | None = None
    finish: int | None = None
    waited: int = 0
    released: bool = False

    def __post_init__(self) -> None:
        if self.remaining == 0:
            self.remaining = self.process.burst

    @property
    def pid(self) -> str:
        return self.process.pid

    @property
    def arrival(self) -> int:
        return self.process.arrival

    @property
    def burst(self) -> int:
        return self.process.burst

    @property
    def priority(self) -> int:
        return self.process.priority

    @property
    def done(self) -> bool:
        return self.finish is not None


@dataclass(frozen=True)
class TimelineSlice:
    """One contiguous run of a process (or idle) under one algorithm."""

    start: int
    end: int
    pid: str | None
    algorithm: str

    @property
    def duration(self) -> int:
        return self.end - self.start


@dataclass(frozen=True)
class DecisionRecord:
    """A logged scheduling decision with a human-readable reason (FR6)."""

    time: int
    algorithm: str
    reason: str
    switched: bool = False


@dataclass(frozen=True)
class Frame:
    """Per-tick snapshot used by the step-through replay."""

    time: int
    running: str | None
    ready: list[str]
    algorithm: str
    remaining: dict[str, int]


@dataclass
class Metrics:
    avg_waiting: float
    avg_turnaround: float
    avg_response: float
    cpu_utilization: float
    context_switches: int
    algorithm_switches: int
    max_waiting: int
    makespan: int


@dataclass
class RunResult:
    algorithm: str
    timeline: list[TimelineSlice] = field(default_factory=list)
    decisions: list[DecisionRecord] = field(default_factory=list)
    processes: list[ProcessState] = field(default_factory=list)
    metrics: Metrics | None = None
    frames: list[Frame] = field(default_factory=list)
    rounds: list[dict] = field(default_factory=list)

    def gantt(self) -> list[TimelineSlice]:
        """Merge adjacent slices with the same pid and algorithm."""
        merged: list[TimelineSlice] = []
        for sl in self.timeline:
            if merged and merged[-1].pid == sl.pid and merged[-1].algorithm == sl.algorithm:
                prev = merged[-1]
                merged[-1] = TimelineSlice(prev.start, sl.end, sl.pid, sl.algorithm)
            else:
                merged.append(sl)
        return merged
