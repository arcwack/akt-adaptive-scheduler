import { useState } from 'react'

import { runCooldownSweep } from '../lib/api'
import type { Config, ProcessInput, SweepRow } from '../lib/types'
import ExportButtons from './ExportButtons'
import Panel from './Panel'
import SweepChart from './SweepChart'

interface Props {
  processes: ProcessInput[]
  config: Config
}

const EXPORT_COLUMNS = [
  { key: 'cooldown', label: 'cooldown_ms' },
  { key: 'algorithm_switches', label: 'algorithm_switches' },
  { key: 'context_switches', label: 'context_switches' },
  { key: 'avg_waiting', label: 'avg_waiting' },
  { key: 'avg_turnaround', label: 'avg_turnaround' },
]

export default function SweepPanel({ processes, config }: Props) {
  const [rows, setRows] = useState<SweepRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await runCooldownSweep(processes, config))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Panel
      title="Cooldown sweep"
      description="Algorithm switches and average waiting at cooldown 0, 4, 8 and 16 ms"
      actions={
        <div className="flex items-center gap-2">
          <ExportButtons
            basename="cooldown-sweep"
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
            {loading ? 'Sweeping…' : 'Run sweep'}
          </button>
        </div>
      }
    >
      {error && (
        <p className="mb-3 whitespace-pre-line text-sm text-red-600">{error}</p>
      )}
      {rows.length === 0 && !error ? (
        <p className="py-8 text-center text-sm text-subtle">
          Run the sweep on the thrashing preset to see why 8 ms was chosen.
        </p>
      ) : (
        <>
          <SweepChart rows={rows} />
          <p className="mt-2 text-xs leading-relaxed text-muted">{caption(rows)}</p>
        </>
      )}
    </Panel>
  )
}

function caption(rows: SweepRow[]): string {
  const first = rows[0]
  const last = rows[rows.length - 1]
  const dir = last.avg_waiting <= first.avg_waiting ? 'falls' : 'rises'
  return (
    `Algorithm switches fall from ${first.algorithm_switches} at ${first.cooldown} ms ` +
    `to ${last.algorithm_switches} at ${last.cooldown} ms. On this workload average ` +
    `waiting ${dir} from ${first.avg_waiting.toFixed(1)} to ${last.avg_waiting.toFixed(1)} ms — ` +
    `the cooldown trade-off is workload dependent.`
  )
}
