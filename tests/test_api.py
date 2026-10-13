"""API contract tests."""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from api.app import app

client = TestClient(app)

WORKLOAD = [
    {"pid": "P1", "arrival": 0, "burst": 6, "priority": 3},
    {"pid": "P2", "arrival": 1, "burst": 2, "priority": 3},
    {"pid": "P3", "arrival": 2, "burst": 8, "priority": 3},
]

DIST = Path(__file__).resolve().parent.parent / "web" / "dist"


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_algorithms_includes_adaptive():
    keys = [a["key"] for a in client.get("/api/algorithms").json()]
    assert "adaptive" in keys
    assert "srtf" in keys


def test_workloads_returns_presets():
    names = [p["name"] for p in client.get("/api/workloads").json()]
    assert "Thrashing (mixed short+long)" in names
    assert "Urgent processes" in names


def test_run_adaptive_has_frames_and_decisions():
    res = client.post("/api/run", json={"processes": WORKLOAD, "algorithm": "adaptive"})
    assert res.status_code == 200
    body = res.json()
    assert len(body["frames"]) == body["metrics"]["makespan"]
    assert body["decisions"]


def test_run_unknown_algorithm_is_400():
    res = client.post("/api/run", json={"processes": WORKLOAD, "algorithm": "nope"})
    assert res.status_code == 400


def test_invalid_priority_is_422():
    bad = [{"pid": "P1", "arrival": 0, "burst": 1, "priority": 0}]
    assert client.post("/api/run", json={"processes": bad}).status_code == 422


def test_cooldown_sweep_shape():
    rows = client.post("/api/cooldown-sweep", json={"processes": WORKLOAD}).json()["rows"]
    assert [r["cooldown"] for r in rows] == [0, 4, 8, 16]


def test_quantum_sweep_shape():
    rows = client.post("/api/quantum-sweep", json={"processes": WORKLOAD}).json()["rows"]
    assert rows[-1]["label"] == "dynamic"


def test_benchmark_matrix_endpoint():
    body = client.post("/api/benchmark/matrix", json={}).json()
    assert len(body["rows"]) == 6
    assert "adaptive" in body["algorithms"]


def test_benchmark_random_endpoint():
    body = client.post(
        "/api/benchmark/random", json={"count": 10, "seed": 42}
    ).json()
    assert body["count"] == 10
    assert body["seed"] == 42
    assert "adaptive" in body["means"]
    assert "avg_waiting" in body["adaptive_best"]


@pytest.mark.skipif(not DIST.is_dir(), reason="dashboard not built")
def test_dashboard_is_served():
    res = client.get("/")
    assert res.status_code == 200
    assert "AKT Adaptive CPU Scheduler" in res.text
