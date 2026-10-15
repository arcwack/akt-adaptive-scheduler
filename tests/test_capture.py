"""Capture-workload tests (pure build_workload maths + nice mapping)."""

from __future__ import annotations

from engine.capture import build_workload, nice_to_priority


def snap(cpu: dict[int, float], names: dict[int, str], nice: dict[int, int]) -> dict:
    return {
        pid: {"name": names[pid], "nice": nice[pid], "cpu": value}
        for pid, value in cpu.items()
    }


NAMES = {10: "alpha", 11: "beta", 12: "gamma", 13: "delta"}
NICE = {10: 0, 11: -5, 12: 5, 13: 0}

SNAPSHOTS = [
    snap({10: 0.0, 11: 0.0, 12: 0.0, 13: 0.0}, NAMES, NICE),
    snap({10: 0.5, 11: 0.2, 12: 0.0, 13: 0.1}, NAMES, NICE),
    snap({10: 1.0, 11: 0.4, 12: 0.3, 13: 0.2}, NAMES, NICE),
    snap({10: 1.5, 11: 0.6, 12: 0.6, 13: 0.3}, NAMES, NICE),
]


def test_build_workload_scales_and_orders():
    result = build_workload(SNAPSHOTS, top=10, window=3)
    assert result["message"] is None
    assert result["count"] == 4
    procs = result["processes"]

    # id by arrival order, ties broken by larger total CPU
    assert [p["real_pid"] for p in procs] == [10, 11, 13, 12]
    assert [p["pid"] for p in procs] == ["P1", "P2", "P3", "P4"]

    # bursts scaled into 1..20, arrivals into 0..30
    for p in procs:
        assert 1 <= p["burst"] <= 20
        assert 0 <= p["arrival"] <= 30
        assert 1 <= p["priority"] <= 5
        assert p["name"]

    assert procs[0]["burst"] == 20  # largest CPU time
    assert procs[3]["arrival"] == 15  # gamma first used CPU in second 2
    assert procs[0]["priority"] == 3  # nice 0
    assert procs[1]["priority"] == 4  # nice -5
    assert procs[3]["priority"] == 2  # nice 5


def test_build_workload_rejects_short_capture():
    short = [
        snap({10: 0.0, 11: 0.0}, NAMES, NICE),
        snap({10: 0.5, 11: 0.3}, NAMES, NICE),
    ]
    result = build_workload(short, top=10, window=3)
    assert result["processes"] == []
    assert "at least 3" in result["message"]


def test_build_workload_excludes_own_process():
    result = build_workload(SNAPSHOTS, top=10, window=3, exclude_pid=10)
    assert all(p["real_pid"] != 10 for p in result["processes"])


def test_nice_to_priority_mapping():
    assert nice_to_priority(0) == 3
    assert nice_to_priority(-15) == 5
    assert nice_to_priority(-1) == 4
    assert nice_to_priority(10) == 2
    assert nice_to_priority(19) == 1
