import { useState } from 'react'

import { runCooldownSweep } from '../lib/api'
import type { Config, ProcessInput, SweepRow } from '../lib/types'
import Panel from './Panel'
import SweepChart from './SweepChart'

interface Props {
  processes: ProcessInput[]
  config: Config
}

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
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
        >
          {loading ? 'Sweeping…' : 'Run sweep'}
        </button>
      }
    >
      {error && (
        <p className="mb-3 whitespace-pre-line text-sm text-red-600">{error}</p>
      )}
      {rows.length === 0 && !error ? (
        <p className="py-8 text-center text-sm text-neutral-400">
          Run the sweep on the thrashing preset to see why 8 ms was chosen.
        </p>
      ) : (
        <>
          <SweepChart rows={rows} />
          <p className="mt-2 text-xs leading-relaxed text-neutral-500">
            Longer cooldown cuts switches and (past a point) raises waiting time —
            the trade-off behind the 8 ms default.
          </p>
        </>
      )}
    </Panel>
  )
}
