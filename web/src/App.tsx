import { useEffect, useState } from 'react'

import ComparisonTable, { type ComparisonRow } from './components/ComparisonTable'
import DecisionLog from './components/DecisionLog'
import ExportButtons from './components/ExportButtons'
import Gantt from './components/Gantt'
import MetricsGrid from './components/MetricsGrid'
import Panel from './components/Panel'
import ProcessResultTable from './components/ProcessResultTable'
import ProcessTable from './components/ProcessTable'
import QuantumPanel from './components/QuantumPanel'
import ReplayPanel from './components/ReplayPanel'
import SweepPanel from './components/SweepPanel'
import ThresholdPanel from './components/ThresholdPanel'
import { fetchWorkloads, runSchedule } from './lib/api'
import {
  ALGORITHMS,
  DEFAULT_CONFIG,
  DEMO_PROCESSES,
  type Config,
  type Preset,
  type ProcessInput,
  type RunResult,
} from './lib/types'
import { useReplay } from './lib/useReplay'

const COMPARISON_COLUMNS = [
  { key: 'algorithm', label: 'algorithm' },
  { key: 'avg_waiting', label: 'avg_waiting' },
  { key: 'avg_turnaround', label: 'avg_turnaround' },
  { key: 'avg_response', label: 'avg_response' },
  { key: 'cpu_utilization', label: 'cpu_utilization' },
  { key: 'context_switches', label: 'context_switches' },
  { key: 'algorithm_switches', label: 'algorithm_switches' },
  { key: 'max_waiting', label: 'max_waiting' },
]

const PROCESS_COLUMNS = [
  { key: 'pid', label: 'pid' },
  { key: 'arrival', label: 'arrival' },
  { key: 'burst', label: 'burst' },
  { key: 'priority', label: 'priority' },
  { key: 'first_run', label: 'first_run' },
  { key: 'finish', label: 'finish' },
  { key: 'waiting', label: 'waiting' },
  { key: 'turnaround', label: 'turnaround' },
  { key: 'response', label: 'response' },
]

export default function App() {
  const [processes, setProcesses] = useState<ProcessInput[]>(DEMO_PROCESSES)
  const [usePriority, setUsePriority] = useState(true)
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [algorithm, setAlgorithm] = useState('adaptive')
  const [result, setResult] = useState<RunResult | null>(null)
  const [rows, setRows] = useState<ComparisonRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [presets, setPresets] = useState<Preset[]>([])

  useEffect(() => {
    let active = true
    fetchWorkloads()
      .then((loaded) => {
        if (active) setPresets(loaded)
      })
      .catch(() => {
        if (active) setPresets([])
      })
    return () => {
      active = false
    }
  }, [])

  const replay = useReplay(result?.metrics.makespan ?? 0)
  const pids = processes.map((p) => p.pid)

  const effectiveProcesses = (): ProcessInput[] =>
    usePriority ? processes : processes.map((p) => ({ ...p, priority: 3 }))

  async function run<T>(work: () => Promise<T>): Promise<T | undefined> {
    setLoading(true)
    setError(null)
    try {
      return await work()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      return undefined
    } finally {
      setLoading(false)
    }
  }

  const applyResult = (res: RunResult) => {
    replay.setTime(0)
    replay.setPlaying(false)
    setResult(res)
  }

  const handleRun = () =>
    run(async () => {
      applyResult(
        await runSchedule({ processes: effectiveProcesses(), algorithm, config }),
      )
    })

  const handleCompare = () =>
    run(async () => {
      const payload = effectiveProcesses()
      const fixed = ALGORITHMS.filter((a) => a.key !== 'adaptive')
      const fixedRuns = await Promise.all(
        fixed.map((a) =>
          runSchedule({ processes: payload, algorithm: a.key, config }).then((r) => ({
            label: a.label,
            metrics: r.metrics,
          })),
        ),
      )
      const adaptive = await runSchedule({
        processes: payload,
        algorithm: 'adaptive',
        config,
      })
      setRows([...fixedRuns, { label: 'Adaptive', metrics: adaptive.metrics, adaptive: true }])
      applyResult(adaptive)
    })

  const applyPreset = (name: string) => {
    const preset = presets.find((p) => p.name === name)
    if (!preset) return
    setProcesses(preset.processes)
    setUsePriority(preset.use_priority)
    if (preset.config) setConfig((c) => ({ ...c, ...preset.config }))
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            AKT Adaptive CPU Scheduler
          </h1>
          <p className="text-sm text-neutral-500">
            Live switching between Priority, SRTF and Round Robin via the AKT-Arbiter.
          </p>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-6 whitespace-pre-line rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Panel
            title="Processes"
            description={
              usePriority
                ? 'ID, arrival, burst and priority (1–5)'
                : 'ID, arrival and burst'
            }
            actions={
              <div className="flex flex-col items-end gap-2">
                <select
                  value=""
                  onChange={(e) => applyPreset(e.target.value)}
                  className="w-44 rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  aria-label="Preset workload"
                >
                  <option value="">Preset workloads…</option>
                  {presets.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-600">
                  <input
                    type="checkbox"
                    checked={usePriority}
                    onChange={(e) => setUsePriority(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 accent-accent"
                  />
                  Set priorities
                </label>
              </div>
            }
          >
            <ProcessTable
              processes={processes}
              onChange={setProcesses}
              usePriority={usePriority}
            />
            {!usePriority && (
              <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                Priority is ignored — every process defaults to 3.
              </p>
            )}
          </Panel>

          <Panel title="Arbiter thresholds" description="Tunable at runtime (FR10)">
            <ThresholdPanel config={config} onChange={setConfig} />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title="Schedule"
            actions={
              <div className="flex items-center gap-2">
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                  className="rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  aria-label="Algorithm"
                >
                  {ALGORITHMS.map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleRun}
                  disabled={loading}
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
                >
                  {loading ? 'Running…' : 'Run'}
                </button>
                <button
                  type="button"
                  onClick={handleCompare}
                  disabled={loading}
                  className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
                >
                  Compare all
                </button>
              </div>
            }
          >
            <Gantt
              gantt={result?.gantt ?? []}
              pids={pids}
              currentTime={result ? replay.time : null}
            />
          </Panel>

          <Panel
            title="Step-through replay"
            description="Scrub time to see the running process, ready queue and algorithm"
          >
            <ReplayPanel
              frames={result?.frames ?? []}
              decisions={result?.decisions ?? []}
              pids={pids}
              replay={replay}
            />
          </Panel>

          {result && (
            <Panel title="Run metrics" description={`Algorithm: ${result.algorithm}`}>
              <MetricsGrid metrics={result.metrics} />
            </Panel>
          )}

          <Panel
            title="Comparison"
            description="Adaptive vs each fixed algorithm"
            actions={
              <ExportButtons
                basename="comparison"
                columns={COMPARISON_COLUMNS}
                rows={
                  rows.map((r) => ({ algorithm: r.label, ...r.metrics })) as unknown as Record<
                    string,
                    unknown
                  >[]
                }
                json={{ rows }}
                disabled={rows.length === 0}
              />
            }
          >
            <ComparisonTable rows={rows} />
          </Panel>

          <SweepPanel processes={effectiveProcesses()} config={config} />

          <QuantumPanel processes={effectiveProcesses()} config={config} />

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Decision log" description="Why each switch happened">
              <DecisionLog decisions={result?.decisions ?? []} />
            </Panel>
            <Panel
              title="Per-process timings"
              actions={
                <ExportButtons
                  basename="per-process"
                  columns={PROCESS_COLUMNS}
                  rows={
                    (result?.processes ?? []) as unknown as Record<string, unknown>[]
                  }
                  json={{ processes: result?.processes ?? [] }}
                  disabled={!result}
                />
              }
            >
              <ProcessResultTable processes={result?.processes ?? []} />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
