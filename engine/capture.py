"""Capture a workload from the live machine (CPU time sampled per second).

Sampling uses psutil; the workload-building maths is a pure function so it can
be tested without touching the real system.
"""

from __future__ import annotations

import os
import time

import psutil

BURST_MIN, BURST_MAX = 1, 20
ARRIVAL_MIN, ARRIVAL_MAX = 0, 30


def nice_to_priority(nice: int) -> int:
    """Map a nice value to 1..5 (lower nice = higher priority, nice 0 = 3)."""
    if nice <= -10:
        return 5
    if nice < 0:
        return 4
    if nice == 0:
        return 3
    if nice <= 10:
        return 2
    return 1


def _clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def build_workload(
    snapshots: list[dict[int, dict]],
    top: int,
    window: int,
    exclude_pid: int | None = None,
) -> dict:
    """Turn a list of per-second snapshots into a scaled workload.

    Each snapshot maps pid -> {"name", "nice", "cpu"} where cpu is the
    cumulative CPU time (user + system) at that instant.
    """
    totals: dict[int, float] = {}
    first_used: dict[int, int] = {}
    meta: dict[int, tuple[str, int]] = {}

    for second in range(1, len(snapshots)):
        prev, cur = snapshots[second - 1], snapshots[second]
        for pid, info in cur.items():
            if pid == exclude_pid or pid not in prev:
                continue
            delta = info["cpu"] - prev[pid]["cpu"]
            if delta <= 0:
                continue
            totals[pid] = totals.get(pid, 0.0) + delta
            meta[pid] = (info.get("name", ""), info.get("nice", 0))
            if pid not in first_used:
                first_used[pid] = second

    if len(totals) < 3:
        return {
            "processes": [],
            "count": 0,
            "window": window,
            "burst_scale": 1.0,
            "arrival_scale": 1.0,
            "message": (
                f"Only {len(totals)} process(es) used CPU in the {window} s window; "
                "need at least 3. Try a longer window."
            ),
        }

    selected = sorted(totals, key=lambda p: totals[p], reverse=True)[:top]
    selected.sort(key=lambda p: (first_used[p], -totals[p], p))

    max_burst = max(totals[p] for p in selected)
    burst_scale = (BURST_MAX / max_burst) if max_burst > 0 else 1.0
    arrival_scale = (ARRIVAL_MAX / max(1, window - 1))

    processes = []
    for index, pid in enumerate(selected, start=1):
        name, nice = meta[pid]
        burst = _clamp(round(totals[pid] * burst_scale), BURST_MIN, BURST_MAX)
        arrival = _clamp(round((first_used[pid] - 1) * arrival_scale), ARRIVAL_MIN, ARRIVAL_MAX)
        processes.append(
            {
                "pid": f"P{index}",
                "arrival": arrival,
                "burst": burst,
                "priority": nice_to_priority(nice),
                "real_pid": pid,
                "name": name,
            }
        )

    return {
        "processes": processes,
        "count": len(processes),
        "window": window,
        "burst_scale": burst_scale,
        "arrival_scale": arrival_scale,
        "message": None,
    }


def collect_samples(window: int, interval: float = 1.0) -> list[dict[int, dict]]:
    """Sample every visible process once per second for `window` seconds."""
    own_pid = os.getpid()
    samples: list[dict[int, dict]] = []
    for step in range(window + 1):
        snapshot: dict[int, dict] = {}
        for proc in psutil.process_iter(["pid", "name", "nice"]):
            try:
                pid = proc.info["pid"]
                if pid == own_pid:
                    continue
                times = proc.cpu_times()
                snapshot[pid] = {
                    "name": proc.info.get("name") or "",
                    "nice": proc.info.get("nice") or 0,
                    "cpu": times.user + times.system,
                }
            except (psutil.AccessDenied, psutil.NoSuchProcess, psutil.ZombieProcess):
                continue
        samples.append(snapshot)
        if step < window:
            time.sleep(interval)
    return samples


def capture_workload(window: int = 10, top: int = 10, interval: float = 1.0) -> dict:
    samples = collect_samples(window, interval)
    return build_workload(samples, top, window, exclude_pid=os.getpid())
