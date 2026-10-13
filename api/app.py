"""FastAPI application exposing the scheduling engine."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from engine.algorithms import ALGORITHM_LABELS, FIXED_ALGORITHMS
from engine.config import SimConfig
from engine.experiments import cooldown_sweep
from engine.models import Process
from engine.simulator import simulate, simulate_adaptive

from .schemas import RunRequest, SweepRequest
from .serializers import serialize_result

app = FastAPI(title="AKT Adaptive CPU Scheduler", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _build_config(payload) -> SimConfig:
    try:
        return SimConfig(**payload.model_dump())
    except ValueError as exc:  # pragma: no cover - guarded by pydantic
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/algorithms")
def algorithms() -> list[dict]:
    return [
        {"key": key, "label": label} for key, label in ALGORITHM_LABELS.items()
    ] + [{"key": "adaptive", "label": "Adaptive"}]


@app.post("/run")
def run(request: RunRequest) -> dict:
    config = _build_config(request.config)
    try:
        processes = [Process(**p.model_dump()) for p in request.processes]
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    if request.algorithm == "adaptive":
        result = simulate_adaptive(processes, config)
    elif request.algorithm in FIXED_ALGORITHMS:
        result = simulate(processes, request.algorithm, config)
    else:
        raise HTTPException(
            status_code=400, detail=f"unknown algorithm '{request.algorithm}'"
        )
    return serialize_result(result)


@app.post("/cooldown-sweep")
def sweep(request: SweepRequest) -> dict:
    config = _build_config(request.config)
    try:
        processes = [Process(**p.model_dump()) for p in request.processes]
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    rows = cooldown_sweep(processes, config, request.cooldowns)
    return {"rows": rows}
