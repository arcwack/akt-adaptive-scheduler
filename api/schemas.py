"""Request/response schemas for the scheduler API."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ProcessIn(BaseModel):
    pid: str
    arrival: int = Field(ge=0)
    burst: int = Field(gt=0)
    priority: int = Field(default=3, ge=1, le=5)


class ConfigIn(BaseModel):
    critical_priority: int = Field(default=4, ge=1, le=5)
    skew_threshold: float = Field(default=0.6, ge=0)
    cooldown: int = Field(default=8, ge=0)
    aging_factor: float = Field(default=3.5, ge=0)
    priority_cap: int = Field(default=20, ge=1)
    quantum_min: int = Field(default=2, gt=0)
    quantum_max: int = Field(default=16, gt=0)
    fixed_quantum: int | None = Field(default=None, gt=0)
    switch_penalty: int = Field(default=1, ge=0)


class RunRequest(BaseModel):
    processes: list[ProcessIn] = Field(min_length=1)
    algorithm: str = "adaptive"
    config: ConfigIn = Field(default_factory=ConfigIn)


class SweepRequest(BaseModel):
    processes: list[ProcessIn] = Field(min_length=1)
    config: ConfigIn = Field(default_factory=ConfigIn)
    cooldowns: list[int] = Field(default_factory=lambda: [0, 4, 8, 16])


class QuantumRequest(BaseModel):
    processes: list[ProcessIn] = Field(min_length=1)
    config: ConfigIn = Field(default_factory=ConfigIn)
    quanta: list[int] = Field(default_factory=lambda: [2, 4, 8])
