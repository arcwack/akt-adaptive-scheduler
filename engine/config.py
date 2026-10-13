"""All tunable parameters for the simulator (FR10)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class SimConfig:
    """Arbiter thresholds and simulation knobs.

    Defaults are the starting points documented in the PRD. They are meant to
    be tuned on test workloads, not treated as proven values.
    """

    critical_priority: int = 4
    skew_threshold: float = 0.6
    cooldown: int = 8
    aging_factor: float = 3.5
    priority_cap: int = 20

    quantum_min: int = 2
    quantum_max: int = 16
    fixed_quantum: int | None = None

    switch_penalty: int = 1

    def __post_init__(self) -> None:
        if self.quantum_min <= 0 or self.quantum_max < self.quantum_min:
            raise ValueError("quantum bounds must satisfy 0 < min <= max")
        if self.cooldown < 0:
            raise ValueError("cooldown must be >= 0")
        if self.switch_penalty < 0:
            raise ValueError("switch_penalty must be >= 0")
        if not 1 <= self.critical_priority <= 5:
            raise ValueError("critical_priority must be in 1..5")
