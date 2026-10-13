"""Workload benchmark tests (matrix + seeded random)."""

from __future__ import annotations

from engine.benchmark import ALGORITHMS, MATRIX_WORKLOADS, matrix_benchmark, random_benchmark


def test_matrix_shape():
    result = matrix_benchmark()
    assert result["algorithms"] == ALGORITHMS
    assert [row["workload"] for row in result["rows"]] == MATRIX_WORKLOADS
    for row in result["rows"]:
        assert set(row["cells"]) == set(ALGORITHMS)
        assert row["cells"]["adaptive"]["avg_waiting"] >= 0


def test_random_benchmark_is_seed_deterministic():
    first = random_benchmark(20, seed=42)
    second = random_benchmark(20, seed=42)
    assert first["means"] == second["means"]
    assert first["adaptive_best"] == second["adaptive_best"]


def test_random_benchmark_different_seeds_differ():
    assert random_benchmark(20, seed=1)["means"] != random_benchmark(20, seed=2)["means"]


def test_random_benchmark_shapes():
    result = random_benchmark(15, seed=7)
    assert result["count"] == 15
    assert set(result["means"]) == set(ALGORITHMS)
    for rate in result["adaptive_best"].values():
        assert 0.0 <= rate <= 1.0
