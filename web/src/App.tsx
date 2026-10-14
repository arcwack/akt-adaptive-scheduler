import { Cpu, GitCompare, Moon, Play, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

import BenchmarkPanel from './components/BenchmarkPanel'
import ArchitecturePanel from './components/ArchitecturePanel'
import ComparisonCharts, { type ChartRow } from './components/ComparisonCharts'
import CvChart from './components/CvChart'
import DecisionLog from './components/DecisionLog'
import ExportButtons from './components/ExportButtons'
import Gantt from './components/Gantt'
import MetricsGrid from './components/MetricsGrid'
import Panel from './components/Panel'
import ProcessLegend from './components/ProcessLegend'
import ProcessResultTable from './components/ProcessResultTable'
import ProcessTable from './components/ProcessTable'
import QuantumPanel from './components/QuantumPanel'
import ReplayPanel from './components/ReplayPanel'
import RoundRobinPanel from './components/RoundRobinPanel'
import StackedGantt, { type GanttRow } from './components/StackedGantt'
import SummaryCards from './components/SummaryCards'
import SweepPanel from './components/SweepPanel'
import Tabs from './components/Tabs'
import ThresholdPanel from './components/ThresholdPanel'
import { fetchWorkloads, runSchedule } from './lib/api'
import {
  ALGORITHMS,
  DEFAULT_CONFIG,
  DEMO_PROCESSES,
  algorithmLabel,
  type Config,
  type Preset,
  type ProcessInput,
  type RunResult,
} from './lib/types'
import { useReplay } from './lib/useReplay'
import { useTheme } from './lib/useTheme'

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

const TABS = [
  { key: 'run', label: 'Run' },
  { key: 'compare', label: 'Compare' },
  { key: 'experiments', label: 'Experiments' },
  { key: 'log', label: 'Log' },
  { key: 'architecture', label: 'Architecture' },
  { key: 'rr', label: 'Round Robin' },
]

export default function App() {
  const [processes, setProcesses] = useState<ProcessInput[]>(DEMO_PROCESSES)
  const [usePriority, setUsePriority] = useState(true)
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [algorithm, setAlgorithm] = useState('adaptive')
  const [runs, setRuns] = useState<Record<string, RunResult>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [presets, setPresets] = useState<Preset[]>([])
  const [runId, setRunId] = useState(0)
  const [tab, setTab] = useState('run')

  const result = runs[algorithm] ?? null
  const replay = useReplay(result?.metrics.makespan ?? 0)
  const theme = useTheme()
  const pids = processes.map((p) => p.pid)

  const rows: ChartRow[] = ALGORITHMS.filter((a) => runs[a.key]).map((a) => ({
    label: a.label,
    metrics: runs[a.key].metrics,
    adaptive: a.key === 'adaptive',
  }))
  const fixedRows = rows.filter((r) => !r.adaptive)
  const bestFixed = fixedRows.length
    ? {
        avg_waiting: Math.min(...fixedRows.map((r) => r.metrics.avg_waiting)),
        avg_response: Math.min(...fixedRows.map((r) => r.metrics.avg_response)),
        algorithm_switches: 0,
        makespan: Math.min(...fixedRows.map((r) => r.metrics.makespan)),
      }
    : null
  const stacked: GanttRow[] = ALGORITHMS.filter((a) => runs[a.key]).map((a) => ({
    key: a.key,
    label: a.label,
    gantt: runs[a.key].gantt,
  }))

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

  const runAll = (goCompare: boolean) =>
    run(async () => {
      const payload = effectiveProcesses()
      const entries = await Promise.all(
        ALGORITHMS.map((a) =>
          runSchedule({ processes: payload, algorithm: a.key, config }).then(
            (r) => [a.key, r] as const,
          ),
        ),
      )
      setRuns(Object.fromEntries(entries))
      setRunId((id) => id + 1)
      replay.setTime(0)
      replay.setPlaying(false)
      if (goCompare) setTab('compare')
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
      {loading && (
        <div
          role="progressbar"
          aria-label="Loading"
          className="progress-track fixed inset-x-0 top-0 z-20 h-0.5 bg-accent/10"
        />
      )}

      <header className="sticky top-0 z-10 -mx-6 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line bg-canvas/85 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-fg text-canvas">
            <Cpu size={18} strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              AKT Adaptive CPU Scheduler
            </h1>
            <p className="text-sm text-muted">
              Live switching between Priority, SRTF and Round Robin via the AKT-Arbiter.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={theme.toggle}
          aria-label="Toggle colour theme"
          className="rounded-md border border-line p-2 text-muted transition-colors hover:text-fg"
        >
          {theme.theme === 'dark' ? (
            <Sun size={16} strokeWidth={1.75} />
          ) : (
            <Moon size={16} strokeWidth={1.75} />
          )}
        </button>
      </header>

      {result && (
        <div className="fade-up mb-6">
          <SummaryCards metrics={result.metrics} bestFixed={bestFixed} />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-6 whitespace-pre-line rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500"
        >
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Panel
            title="Processes"
            description={usePriority ? 'ID, arrival, burst and priority (1–5)' : 'ID, arrival and burst'}
            actions={
              <div className="flex flex-col items-end gap-2">
                <select
                  value=""
                  onChange={(e) => applyPreset(e.target.value)}
                  className="w-44 rounded-md border border-line bg-surface px-2 py-1.5 text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  aria-label="Preset workload"
                >
                  <option value="">Preset workloads…</option>
                  {presets.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-xs font-medium text-muted">
                  <input
                    type="checkbox"
                    checked={usePriority}
                    onChange={(e) => setUsePriority(e.target.checked)}
                    className="h-4 w-4 rounded border-line accent-accent"
                  />
                  Set priorities
                </label>
              </div>
            }
          >
            <ProcessTable processes={processes} onChange={setProcesses} usePriority={usePriority} />
          </Panel>

          <Panel title="Arbiter thresholds" description="Tunable at runtime (FR10)">
            <ThresholdPanel config={config} onChange={setConfig} />
          </Panel>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="rounded-md border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
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
              onClick={() => runAll(false)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md bg-fg px-3 py-1.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Play size={15} strokeWidth={1.75} />
              {loading ? 'Running…' : 'Run'}
            </button>
            <button
              type="button"
              onClick={() => runAll(true)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-muted disabled:opacity-50"
            >
              <GitCompare size={15} strokeWidth={1.75} />
              Compare all
            </button>
          </div>

          <Tabs tabs={TABS} active={tab} onChange={setTab} />

          {tab === 'run' && (
            <div className="space-y-6">
              <Panel
                title="Schedule"
                description={
                  result
                    ? result.algorithm === algorithm
                      ? algorithmLabel(algorithm)
                      : `Adaptive (last: ${algorithmLabel(result.algorithm)})`
                    : undefined
                }
              >
                <Gantt
                  gantt={result?.gantt ?? []}
                  pids={pids}
                  currentTime={result ? replay.time : null}
                  animationKey={runId}
                />
                <div className="mt-3">
                  <ProcessLegend pids={pids} />
                </div>
              </Panel>

              <Panel title="Step-through replay" description="Scrub time to see running process, ready queue and algorithm">
                <ReplayPanel
                  frames={result?.frames ?? []}
                  decisions={result?.decisions ?? []}
                  pids={pids}
                  replay={replay}
                />
              </Panel>

              <Panel title="Ready-queue CV over time" description="Line = CV, dashed = skew threshold, background = active algorithm">
                <CvChart frames={result?.frames ?? []} threshold={config.skew_threshold} />
              </Panel>

              {result && (
                <Panel
                  title="Run metrics"
                  description={
                    algorithm === 'adaptive'
                      ? `Adaptive (last: ${algorithmLabel(result.algorithm)})`
                      : algorithmLabel(algorithm)
                  }
                >
                  <MetricsGrid metrics={result.metrics} />
                </Panel>
              )}
            </div>
          )}

          {tab === 'compare' && (
            <div className="space-y-6">
              <Panel
                title="Metrics by algorithm"
                description="Grouped bars; Adaptive in accent, fixed algorithms muted"
                actions={
                  <ExportButtons
                    basename="comparison"
                    columns={COMPARISON_COLUMNS}
                    rows={rows.map((r) => ({ algorithm: r.label, ...r.metrics })) as unknown as Record<string, unknown>[]}
                    json={{ rows }}
                    disabled={rows.length === 0}
                  />
                }
              >
                <ComparisonCharts rows={rows} />
              </Panel>

              <Panel title="All algorithms on one time axis" description="One Gantt row per algorithm">
                <StackedGantt rows={stacked} pids={pids} />
                <div className="mt-3">
                  <ProcessLegend pids={pids} />
                </div>
              </Panel>
            </div>
          )}

          {tab === 'experiments' && (
            <div className="space-y-6">
              <SweepPanel processes={effectiveProcesses()} config={config} />
              <QuantumPanel processes={effectiveProcesses()} config={config} />
              <BenchmarkPanel config={config} />
            </div>
          )}

          {tab === 'log' && (
            <div className="space-y-6">
              <Panel title="Decision log" description="Why each switch happened">
                <DecisionLog decisions={result?.decisions ?? []} />
              </Panel>
              <Panel
                title="Per-process timings"
                actions={
                  <ExportButtons
                    basename="per-process"
                    columns={PROCESS_COLUMNS}
                    rows={(result?.processes ?? []) as unknown as Record<string, unknown>[]}
                    json={{ processes: result?.processes ?? [] }}
                    disabled={!result}
                  />
                }
              >
                <ProcessResultTable processes={result?.processes ?? []} />
              </Panel>
            </div>
          )}

          {tab === 'architecture' && <ArchitecturePanel />}

          {tab === 'rr' && (
            <RoundRobinPanel processes={effectiveProcesses()} config={config} />
          )}
        </div>
      </div>
    </div>
  )
}
