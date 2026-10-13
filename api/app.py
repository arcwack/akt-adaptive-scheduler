"""FastAPI application exposing the scheduling engine."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from engine.algorithms import ALGORITHM_LABELS, FIXED_ALGORITHMS
from engine.config import SimConfig
from engine.experiments import cooldown_sweep, quantum_experiment
from engine.models import Process
from engine.presets import serialize_presets
from engine.simulator import simulate, simulate_adaptive

from .schemas import QuantumRequest, RunRequest, SweepRequest
from .serializers import serialize_result

DESCRIPTION = """
A CPU scheduling simulator that watches the ready queue and live-switches
between **Priority**, **SRTF** and **Round Robin** using the **AKT-Arbiter**,
with a cooldown that stops it switching too often.

Every run is compared against the fixed algorithms (FCFS, SJF, SRTF, Round
Robin, Priority).
"""

app = FastAPI(
    title="AKT Adaptive CPU Scheduler",
    description=DESCRIPTION,
    version="0.4.0",
    contact={"name": "AKT Team"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter(prefix="/api")


def _to_processes(request) -> list[Process]:
    try:
        return [Process(**p.model_dump()) for p in request.processes]
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def _to_config(request) -> SimConfig:
    try:
        return SimConfig(**request.config.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/health", tags=["System"], summary="Liveness check")
def health() -> dict:
    return {"status": "ok"}


@router.get("/algorithms", tags=["System"], summary="List schedulable algorithms")
def algorithms() -> list[dict]:
    return [
        {"key": key, "label": label} for key, label in ALGORITHM_LABELS.items()
    ] + [{"key": "adaptive", "label": "Adaptive"}]


@router.get("/workloads", tags=["Workloads"], summary="Preset test workloads")
def workloads() -> list[dict]:
    return serialize_presets()


@router.post("/run", tags=["Scheduling"], summary="Run one algorithm over a workload")
def run(request: RunRequest) -> dict:
    config = _to_config(request)
    processes = _to_processes(request)

    if request.algorithm == "adaptive":
        result = simulate_adaptive(processes, config)
    elif request.algorithm in FIXED_ALGORITHMS:
        result = simulate(processes, request.algorithm, config)
    else:
        raise HTTPException(
            status_code=400, detail=f"unknown algorithm '{request.algorithm}'"
        )
    return serialize_result(result)


@router.post(
    "/cooldown-sweep",
    tags=["Experiments"],
    summary="Adaptive switches and waiting across cooldown values",
)
def sweep(request: SweepRequest) -> dict:
    config = _to_config(request)
    processes = _to_processes(request)
    return {"rows": cooldown_sweep(processes, config, request.cooldowns)}


@router.post(
    "/quantum-sweep",
    tags=["Experiments"],
    summary="Round Robin fixed quanta vs the dynamic quantum",
)
def quantum_sweep(request: QuantumRequest) -> dict:
    config = _to_config(request)
    processes = _to_processes(request)
    return {"rows": quantum_experiment(processes, config, request.quanta)}


app.include_router(router)

# Serve the built dashboard (single-command demo) when it exists. API routes are
# registered under /api above, so they take precedence over the catch-all mount.
_DIST = Path(__file__).resolve().parent.parent / "web" / "dist"
if _DIST.is_dir():
    app.mount("/", StaticFiles(directory=str(_DIST), html=True), name="dashboard")
