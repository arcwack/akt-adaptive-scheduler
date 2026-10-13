import { useState } from 'react'

import { runQuantumExperiment } from '../lib/api'
import type { Config, ProcessInput, QuantumRow } from '../lib/types'
import ExportButtons from './ExportButtons'
import Panel from './Panel'

interface Props {
  processes: ProcessInput[]
  config: Config
}

const COLUMNS: { label: string; get: (r: QuantumRow) => string }[] = [
  { label: 'Waiting', get: (r) => r.avg_waiting.toFixed(2) },
  { label: 'Response', get: (r) => r.avg_response.toFixed(2) },
  { label: 'Turnaround', get: (r) => r.avg_turnaround.toFixed(2) },
  { label: 'CtxSw', get: (r) => String(r.context_switches) },
]

const EXPORT_COLUMNS = [
  { key: 'label', label: 'quantum' },
  { key: 'avg_waiting', label: 'avg_waiting' },
  { key: 'avg_response', label: 'avg_response' },
  { key: 'avg_turnaround', label: 'avg_turnaround' },
  { key: 'context_switches', label: 'context_switches' },
  { key: 'max_waiting', label: 'max_waiting' },
]

export default function QuantumPanel({ processes, config }: Props) {
  const [rows, setRows] = useState<QuantumRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await runQuantumExperiment(processes, config))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const dynamic = rows.find((r) => r.dynamic)

  return (
    <Panel
      title="Dynamic quantum experiment"
      description="Round Robin with fixed quanta vs the dynamic quantum (FR11)"
      actions={
        <div className="flex items-center gap-2">
          <ExportButtons
            basename="quantum-experiment"
            columns={EXPORT_COLUMNS}
            rows={rows as unknown as Record<string, unknown>[]}
            json={{ rows }}
            disabled={rows.length === 0}
          />
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface-muted disabled:opacity-50"
          >
            {loading ? 'Running…' : 'Run'}
          </button>
        </div>
      }
    >
      {error && (
        <p className="mb-3 whitespace-pre-line text-sm text-red-600">{error}</p>
      )}
      {rows.length === 0 && !error ? (
        <p className="py-8 text-center text-sm text-subtle">
          Compare fixed quanta (2, 4, 8 ms) against the dynamic median-based quantum.
        </p>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-3 py-2 font-medium">Quantum</th>
                {COLUMNS.map((c) => (
                  <th key={c.label} className="px-3 py-2 text-right font-medium">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.label}
                  className={
                    r.dynamic
                      ? 'border-b border-line-soft bg-accent-soft font-medium last:border-0'
                      : 'border-b border-line-soft last:border-0'
                  }
                >
                  <td className="px-3 py-2">{r.label}</td>
                  {COLUMNS.map((c) => (
                    <td key={c.label} className="px-3 py-2 text-right tabular-nums">
                      {c.get(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {dynamic && (
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {verdict(rows, dynamic)}
            </p>
          )}
        </>
      )}
    </Panel>
  )
}

const COMPARED = [
  { label: 'waiting', get: (r: QuantumRow) => r.avg_waiting, int: false },
  { label: 'response', get: (r: QuantumRow) => r.avg_response, int: false },
  { label: 'context switches', get: (r: QuantumRow) => r.context_switches, int: true },
]

function verdict(rows: QuantumRow[], dynamic: QuantumRow): string {
  const fixed = rows.filter((r) => !r.dynamic)
  const parts = COMPARED.map((m) => {
    const best = Math.min(...fixed.map(m.get))
    const dyn = m.get(dynamic)
    const fmt = (v: number) => (m.int ? String(v) : v.toFixed(2))
    return `${m.label} ${dyn <= best ? 'dynamic wins' : 'fixed wins'} (${fmt(dyn)} vs ${fmt(best)})`
  })
  return `Dynamic vs best fixed quantum — ${parts.join('; ')}.`
}
