import type { Metrics } from '../lib/types'

interface Props {
  metrics: Metrics
}

interface Stat {
  label: string
  value: string
}

function stats(m: Metrics): Stat[] {
  return [
    { label: 'Avg waiting', value: m.avg_waiting.toFixed(2) },
    { label: 'Avg turnaround', value: m.avg_turnaround.toFixed(2) },
    { label: 'Avg response', value: m.avg_response.toFixed(2) },
    { label: 'CPU util', value: `${(m.cpu_utilization * 100).toFixed(1)}%` },
    { label: 'Context switches', value: String(m.context_switches) },
    { label: 'Algorithm switches', value: String(m.algorithm_switches) },
    { label: 'Max waiting', value: String(m.max_waiting) },
    { label: 'Makespan', value: `${m.makespan} ms` },
  ]
}

export default function MetricsGrid({ metrics }: Props) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-4">
      {stats(metrics).map((s) => (
        <div key={s.label} className="bg-white px-4 py-3">
          <div className="text-xs text-neutral-500">{s.label}</div>
          <div className="mt-0.5 text-lg font-semibold tabular-nums">
            {s.value}
          </div>
        </div>
      ))}
    </div>
  )
}
