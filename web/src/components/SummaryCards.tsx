import type { Metrics } from '../lib/types'

interface Props {
  metrics: Metrics | null
  bestFixed: Record<string, number> | null
}

interface Card {
  key: keyof Metrics
  label: string
  fmt: (v: number) => string
}

const CARDS: Card[] = [
  { key: 'avg_waiting', label: 'Avg waiting', fmt: (v) => v.toFixed(2) },
  { key: 'avg_response', label: 'Avg response', fmt: (v) => v.toFixed(2) },
  { key: 'algorithm_switches', label: 'Algorithm switches', fmt: (v) => String(v) },
  { key: 'makespan', label: 'Makespan', fmt: (v) => `${v} ms` },
]

export default function SummaryCards({ metrics, bestFixed }: Props) {
  if (!metrics) {
    return null
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {CARDS.map((card) => {
        const value = metrics[card.key] as number
        const best = bestFixed?.[card.key]
        const delta = best === undefined ? null : value - best
        const better = delta !== null && delta <= 1e-9
        return (
          <div
            key={card.key}
            className="rounded-xl border border-line bg-surface px-4 py-3.5"
          >
            <div className="text-xs text-muted">{card.label}</div>
            <div className="mt-1 text-3xl font-semibold tabular-nums">
              {card.fmt(value)}
            </div>
            <div className="mt-1 text-xs">
              {delta === null ? (
                <span className="text-subtle">run to compare</span>
              ) : (
                <span className={better ? 'text-emerald-500' : 'text-amber-500'}>
                  {delta <= 1e-9 ? 'best of all' : `+${card.fmt(delta)} vs best fixed`}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
