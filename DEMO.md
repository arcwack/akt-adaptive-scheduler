# Demo script — AKT Adaptive CPU Scheduler

A CPU scheduling simulator that watches the ready queue and live-switches
between **Priority**, **SRTF** and **Round Robin** using the **AKT-Arbiter**,
with a cooldown that stops it switching too often. Every run is compared against
the fixed algorithms (FCFS, SJF, SRTF, Round Robin, Priority).

## Run it

One command (backend serves the built dashboard):

```bash
cd web && npm install && npm run build && cd ..
python3 -m uvicorn api.app:app --port 8000
# open http://localhost:8000
```

Interactive API docs: http://localhost:8000/docs

Alternatively, for live code reload during development:

```bash
python3 -m uvicorn api.app:app --reload --port 8000   # terminal 1
cd web && npm run dev                                 # terminal 2 -> http://localhost:5173
```

CLI-only check (no browser):

```bash
python3 -m engine.cli            # comparison table + Gantt
python3 -m pytest -q             # full test suite
```

## 6-minute walkthrough

1. **Preset: "Classic textbook"** — press **Run** (Algorithm: Adaptive).
   Point at the **Gantt** and the **algorithm band** above it. Say: "the arbiter
   chose Round Robin, then switched to Priority at t=1 and to Round Robin at
   t=9; the band shows exactly when and the decision log says why."

2. **Switch log** — in the Decision log, read a line aloud, e.g.
   `t=1  priority — urgent: priority 4 >= 4`. Every switch carries its reason
   (FR6). Mention the 8 ms cooldown and the `cooldown: kept ...` lines.

3. **Step-through replay** — drag the slider (or press Play) and stop at a
   switch. The panel shows the **running process**, the **ready queue** with
   remaining bursts, and the **current algorithm** at that exact millisecond.
   "This is where the arbiter switches, and this is why." Use *Jump to switch*.

4. **Preset: "Urgent processes"** — Run. The urgent rule fires; open the
   replay at the arrival of a priority-5 job to show the preemption.

5. **Preset: "Thrashing (mixed short+long)"** — press **Compare all** to show
   the summary table (Adaptive is the last row). Then press **Run sweep** on the
   **Cooldown sweep**: switches fall as cooldown grows and waiting time drops —
   the evidence for the 8 ms default and the thrashing limitation we fix.

6. **Dynamic quantum experiment** — press **Run**. Round Robin at fixed 2/4/8 ms
   vs the dynamic median-based quantum, reported honestly (FR11).

7. **Scalability** — preset **"Scalability (50 jobs)"** (use priorities off),
   Run. It finishes instantly; 50 processes are handled well under the NFR.

8. **Export** — from Comparison / Cooldown sweep / Quantum / Per-process panels,
   download **CSV** or **JSON** (FR10).

## Where the logic lives (for the viva)

- `engine/arbiter.py` — the three rules and the safeguards (cooldown, aging,
  priority cap). First match wins: urgent -> Priority, `CV > 0.6` -> SRTF,
  else Round Robin.
- `engine/algorithms/` — FCFS, SJF, SRTF, Round Robin (fixed or dynamic
  quantum), Priority, each its own module.
- `engine/simulator.py` — tick loop (1 tick = 1 ms), switch penalty, per-tick
  frames for the replay.
- `engine/workload.py` — mean, standard deviation, CV, max wait, max priority.
- `engine/experiments.py` — cooldown sweep and dynamic-quantum experiment.

## Honest limits (say these before they are asked)

- A longer cooldown reacts more slowly to real changes.
- Workloads that never hover near the skew threshold do not thrash, so the
  cooldown changes nothing there.
- Switching cost is modelled as a counted metric plus a 1 ms penalty per switch.
- The 0.6 skew threshold is a starting point (small queues cap CV near
  `sqrt(N) - 1`), not a proven value.
