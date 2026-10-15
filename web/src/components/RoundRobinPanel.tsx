import { useState } from 'react'

import { runQuantumTradeoff, runSchedule } from '../lib/api'
import { Y_METRICS, type TradeoffMetric } from '../lib/tradeoffMetrics'
import type { Config, GanttSlice, Metrics, ProcessInput, RunResult, TradeoffPoint } from '../lib/types'
import ExportButtons from './ExportButtons'
import Gantt from './Gantt'
import MetricsGrid from './MetricsGrid'
import Panel from './Panel'
import ProcessLegend from './ProcessLegend'
import QuantumTradeoffChart from './QuantumTradeoffChart'
import StackedGantt, { type GanttRow } from './StackedGantt'

interface Props {
  processes: ProcessInput[]
  config: Config
}

interface CompareRow {
  label: string
  dynamic: boolean
  metrics: Metrics
  gantt: GanttSlice[]
}

const COLUMNS: { key: keyof Metrics; label: string; fmt: (v: number) => string }[] = [
  { key: 'avg_waiting', label: 'Waiting', fmt: (v) => v.toFixed(2) },
  { key: 'avg_response', label: 'Response', fmt: (v) => v.toFixed(2) },
  { key: 'avg_turnaround', label: 'Turnaround', fmt: (v) => v.toFixed(2) },
  { key: 'context_switches', label: 'CtxSw', fmt: (v) => String(v) },
]

function caption(rows: CompareRow[]): string {
  const winners = COLUMNS.map((c) => {
    const values = rows.map((r) => ({ row: r, value: r.metrics[c.key] as number }))
    const best = Math.min(...values.map((v) => v.value))
    return {
      label: c.label,
      winners: values.filter((v) => v.value <= best + 1e-9).map((v) => v.row.label),
    }
  })
  const distinct = new Set(winners.flatMap((w) => w.winners))
  const lead =
    distinct.size === 1
      ? `${[...distinct][0]} wins every metric.`
      : 'No single quantum wins every metric.'
  const detail = winners.map((w) => `${w.label} → ${w.winners.join(' / ')}`).join('; ')
  return `${lead} Best by metric: ${detail}.`
}

const inputClass =
  'rounded-md border border-line bg-surface px-2 py-1.5 text-sm tabular-nums outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'

export default function RoundRobinPanel({ processes, config }: Props) {
  const [quantum, setQuantum] = useState('')
  const [live, setLive] = useState<RunResult | null>(null)
  const [compare, setCompare] = useState<CompareRow[]>([])
  const [loading, setLoading] = useState<'live' | 'compare' | 'tradeoff' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tradeoff, setTradeoff] = useState<TradeoffPoint[]>([])
  const [tradeoffMetric, setTradeoffMetric] = useState<TradeoffMetric>('avg_waiting')
  const pids = processes.map((p) => p.pid)

  const withQuantum = (fixed: number | null): Config => ({ ...config, fixed_quantum: fixed })

  const runLive = async () => {
    setLoading('live')
    setError(null)
    try {
      const parsed = Number(quantum)
      const fixed = quantum.trim() === '' || Number.isNaN(parsed) ? null : Math.max(1, parsed)
      setLive(await runSchedule({ processes, algorithm: 'rr', config: withQuantum(fixed) }))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(null)
    }
  }

  const runCompare = async () => {
    setLoading('compare')
    setError(null)
    try {
      const fixed = await Promise.all(
        [2, 4, 8].map((q) =>
          runSchedule({ processes, algorithm: 'rr', config: withQuantum(q) }).then((r) => ({
            label: `Fixed ${q} ms`,
            dynamic: false,
            metrics: r.metrics,
            gantt: r.gantt,
          })),
        ),
      )
      const dynamic = await runSchedule({
        processes,
        algorithm: 'rr',
        config: withQuantum(null),
      })
      setCompare([
        ...fixed,
        { label: 'Dynamic', dynamic: true, metrics: dynamic.metrics, gantt: dynamic.gantt },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(null)
    }
  }

  const stacked: GanttRow[] = compare.map((r) => ({
    key: r.label,
    label: r.label,
    gantt: r.gantt,
  }))

  const runTradeoff = async () => {
    setLoading('tradeoff')
    setError(null)
    try {
      setTradeoff(await runQuantumTradeoff(processes, config))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="whitespace-pre-line rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <Panel
        title="Round Robin — live"
        description="Current process list with the entered quantum (empty = dynamic)"
        actions={
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              placeholder="dynamic"
              value={quantum}
              onChange={(e) => setQuantum(e.target.value)}
              className={`${inputClass} w-24`}
              aria-label="Fixed quantum (empty = dynamic)"
            />
            <button
              type="button"
              onClick={runLive}
              disabled={loading === 'live'}
              className="rounded-md bg-fg px-3 py-1.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading === 'live' ? 'Running…' : 'Run'}
            </button>
          </div>
        }
      >
        {live ? (
          <div className="space-y-4">
            <MetricsGrid metrics={live.metrics} />
            <Gantt gantt={live.gantt} pids={pids} />
            <ProcessLegend pids={pids} />
            <div>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold">Round by round</h3>
                <p className="font-mono text-xs text-muted">
                  quantum = min(max_q, max(min_q, median remaining burst))
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-muted">
                      <th className="px-3 py-2 font-medium">Round</th>
                      <th className="px-3 py-2 font-medium">t (ms)</th>
                      <th className="px-3 py-2 font-medium">Ready remaining</th>
                      <th className="px-3 py-2 text-right font-medium">Median</th>
                      <th className="px-3 py-2 text-right font-medium">Quantum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {live.rounds.map((r) => (
                      <tr key={r.round} className="border-b border-line-soft last:border-0">
                        <td className="px-3 py-1.5">{r.round}</td>
                        <td className="px-3 py-1.5 tabular-nums">{r.time}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">
                          [{r.remaining.join(', ')}]
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {r.median}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {r.quantum} ms
                          <span className="ml-1.5 text-xs text-subtle">
                            ({r.dynamic ? 'dynamic' : 'fixed'})
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-subtle">
                min_q = {config.quantum_min} ms, max_q = {config.quantum_max} ms.
              </p>
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-subtle">
            Press Run to see the round-by-round quantum and Gantt.
          </p>
        )}
      </Panel>

      <Panel
        title="Fixed vs dynamic quantum"
        description="Fixed 2, 4, 8 ms and dynamic on one shared time axis"
        actions={
          <button
            type="button"
            onClick={runCompare}
            disabled={loading === 'compare'}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-muted disabled:opacity-50"
          >
            {loading === 'compare' ? 'Running…' : 'Run'}
          </button>
        }
      >
        {compare.length === 0 ? (
          <p className="py-8 text-center text-sm text-subtle">
            Press Run to compare fixed quanta against the dynamic quantum.
          </p>
        ) : (
          <div className="space-y-4">
            <StackedGantt rows={stacked} pids={pids} showDuration />
            <ProcessLegend pids={pids} />

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-muted">
                    <th className="px-3 py-2 font-medium">Quantum</th>
                    {COLUMNS.map((c) => (
                      <th key={c.key} className="px-3 py-2 text-right font-medium">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compare.map((row) => (
                    <tr
                      key={row.label}
                      className={`border-b border-line-soft last:border-0 ${
                        row.dynamic ? 'bg-accent-soft font-medium' : ''
                      }`}
                    >
                      <td className="px-3 py-2">{row.label}</td>
                      {COLUMNS.map((c) => {
                        const values = compare.map((r) => r.metrics[c.key] as number)
                        const best = Math.min(...values)
                        const value = row.metrics[c.key] as number
                        return (
                          <td
                            key={c.key}
                            className={`px-3 py-2 text-right tabular-nums ${
                              value <= best + 1e-9 ? 'font-semibold text-emerald-500' : ''
                            }`}
                          >
                            {c.fmt(value)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs leading-relaxed text-muted">{caption(compare)}</p>
          </div>
        )}
      </Panel>

      <Panel
        title="Quantum trade-off"
        description="Context switches vs the chosen metric for quanta 1–16 and dynamic"
        actions={
          <div className="flex items-center gap-2">
            <ExportButtons
              basename="quantum-tradeoff"
              columns={TRADEOFF_COLUMNS}
              rows={tradeoff as unknown as Record<string, unknown>[]}
              json={{ points: tradeoff }}
              disabled={tradeoff.length === 0}
            />
            <button
              type="button"
              onClick={runTradeoff}
              disabled={loading === 'tradeoff'}
              className="rounded-md border border-line px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-muted disabled:opacity-50"
            >
              {loading === 'tradeoff' ? 'Running…' : 'Run'}
            </button>
          </div>
        }
      >
        {tradeoff.length === 0 ? (
          <p className="py-8 text-center text-sm text-subtle">
            Press Run to plot the waiting / context-switch trade-off across quanta.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted">Y axis</span>
              <select
                value={tradeoffMetric}
                onChange={(e) =>
                  setTradeoffMetric(e.target.value as TradeoffMetric)
                }
                className="rounded-md border border-line bg-surface px-2 py-1 text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                aria-label="Y axis metric"
              >
                {Y_METRICS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <QuantumTradeoffChart points={tradeoff} metricKey={tradeoffMetric} />
            <p className="text-xs leading-relaxed text-muted">
              {tradeoffCaption(tradeoff, tradeoffMetric)}
            </p>
          </div>
        )}
      </Panel>
    </div>
  )
}

const TRADEOFF_COLUMNS = [
  { key: 'quantum', label: 'quantum' },
  { key: 'dynamic', label: 'dynamic' },
  { key: 'context_switches', label: 'context_switches' },
  { key: 'avg_waiting', label: 'avg_waiting' },
  { key: 'avg_response', label: 'avg_response' },
  { key: 'avg_turnaround', label: 'avg_turnaround' },
]

function tradeoffCaption(
  points: TradeoffPoint[],
  metricKey: TradeoffMetric,
): string {
  const fixed = points.filter((p) => !p.dynamic)
  const dynamic = points.find((p) => p.dynamic)
  const metric = Y_METRICS.find((m) => m.key === metricKey) ?? Y_METRICS[0]
  if (!dynamic || fixed.length === 0) return 'Not enough data to compare.'
  const beats = fixed.filter(
    (p) =>
      p.context_switches < dynamic.context_switches &&
      p[metricKey] < dynamic[metricKey],
  ).length
  if (beats === 0) {
    return `No fixed quantum beats dynamic on both ${metric.short} and context switches.`
  }
  return `${beats} of ${fixed.length} fixed quanta beat dynamic on both ${metric.short} and context switches.`
}
