import type { ProcessResult } from '../lib/types'

interface Props {
  processes: ProcessResult[]
}

const COLS: { label: string; get: (p: ProcessResult) => string | number }[] = [
  { label: 'Arrival', get: (p) => p.arrival },
  { label: 'Burst', get: (p) => p.burst },
  { label: 'Prio', get: (p) => p.priority },
  { label: 'Start', get: (p) => p.first_run },
  { label: 'Finish', get: (p) => p.finish },
  { label: 'Waiting', get: (p) => p.waiting },
  { label: 'Turnaround', get: (p) => p.turnaround },
  { label: 'Response', get: (p) => p.response },
]

export default function ProcessResultTable({ processes }: Props) {
  if (processes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-subtle">
        Per-process timings appear after a run.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            <th className="px-3 py-2 font-medium">PID</th>
            {COLS.map((c) => (
              <th key={c.label} className="px-3 py-2 text-right font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {processes.map((p) => (
            <tr key={p.pid} className="border-b border-line-soft last:border-0">
              <td className="px-3 py-2 font-medium">{p.pid}</td>
              {COLS.map((c) => (
                <td key={c.label} className="px-3 py-2 text-right tabular-nums">
                  {c.get(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
