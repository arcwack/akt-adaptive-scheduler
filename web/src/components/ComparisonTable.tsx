import type { Metrics } from '../lib/types'

export interface ComparisonRow {
  label: string
  metrics: Metrics
  adaptive?: boolean
}

interface Props {
  rows: ComparisonRow[]
}

const COLUMNS: { label: string; get: (m: Metrics) => string }[] = [
  { label: 'Waiting', get: (m) => m.avg_waiting.toFixed(2) },
  { label: 'Turnaround', get: (m) => m.avg_turnaround.toFixed(2) },
  { label: 'Response', get: (m) => m.avg_response.toFixed(2) },
  { label: 'CPU%', get: (m) => (m.cpu_utilization * 100).toFixed(1) },
  { label: 'CtxSw', get: (m) => String(m.context_switches) },
  { label: 'AlgoSw', get: (m) => String(m.algorithm_switches) },
  { label: 'MaxWait', get: (m) => String(m.max_waiting) },
]

export default function ComparisonTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-subtle">
        Compare all algorithms to see the summary table.
      </p>
    )
  }

  const best = Math.min(...rows.map((r) => r.metrics.avg_waiting))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            <th className="px-3 py-2 font-medium">Algorithm</th>
            {COLUMNS.map((c) => (
              <th key={c.label} className="px-3 py-2 text-right font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              className={
                row.adaptive
                  ? 'border-b border-line-soft bg-accent-soft font-medium'
                  : 'border-b border-line-soft'
              }
            >
              <td className="px-3 py-2">{row.label}</td>
              {COLUMNS.map((c) => {
                const isBest =
                  c.label === 'Waiting' &&
                  row.metrics.avg_waiting === best &&
                  !row.adaptive
                return (
                  <td
                    key={c.label}
                    className={`px-3 py-2 text-right tabular-nums ${
                      isBest ? 'font-semibold text-emerald-500' : ''
                    }`}
                  >
                    {c.get(row.metrics)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
