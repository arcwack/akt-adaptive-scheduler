import { BENCH_METRICS } from '../lib/benchmarkMetrics'
import { MUTED_BAR } from '../lib/palette'
import type { Metrics } from '../lib/types'

export interface ChartRow {
  label: string
  metrics: Metrics
  adaptive?: boolean
}

interface Props {
  rows: ChartRow[]
}

const SHORT: Record<string, string> = {
  avg_waiting: 'Waiting',
  avg_turnaround: 'Turnaround',
  avg_response: 'Response',
  context_switches: 'CtxSw',
  max_waiting: 'MaxWait',
  cpu_utilization: 'CPU%',
}

const W = 820
const H = 200
const PAD = { top: 14, right: 16, bottom: 24, left: 16 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom

export default function ComparisonCharts({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-subtle">
        Run to compare all algorithms.
      </p>
    )
  }

  const band = PLOT_W / BENCH_METRICS.length
  const barW = (band * 0.78) / rows.length
  const ACCENT = 'var(--accent)'

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Metrics by algorithm"
      >
        {BENCH_METRICS.map((metric, g) => {
          const groupX = PAD.left + band * g
          const values = rows.map((r) => r.metrics[metric.key] as number)
          const max = Math.max(1e-9, ...values)
          return (
            <g key={metric.key}>
              {g > 0 && (
                <line
                  x1={groupX}
                  x2={groupX}
                  y1={PAD.top}
                  y2={PAD.top + PLOT_H}
                  stroke="var(--line)"
                  strokeWidth={1}
                />
              )}
              {rows.map((row, i) => {
                const value = row.metrics[metric.key] as number
                const h = (value / max) * PLOT_H
                const x = groupX + band * 0.11 + i * barW
                return (
                  <rect
                    key={row.label}
                    x={x}
                    y={PAD.top + PLOT_H - h}
                    width={Math.max(2, barW - 2)}
                    height={h}
                    rx={2}
                    fill={row.adaptive ? ACCENT : MUTED_BAR}
                    opacity={row.adaptive ? 1 : 0.55}
                  >
                    <title>{`${row.label} · ${metric.label}: ${metric.fmt(value)}`}</title>
                  </rect>
                )
              })}
              <text
                x={groupX + band / 2}
                y={H - PAD.bottom + 14}
                fontSize={11}
                fill="var(--muted)"
                textAnchor="middle"
              >
                {SHORT[metric.key] ?? metric.label}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: ACCENT }} />
          Adaptive
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm opacity-55"
            style={{ backgroundColor: MUTED_BAR }}
          />
          Fixed algorithms
        </span>
        <span className="text-subtle">each metric scaled to its own maximum</span>
      </div>
    </div>
  )
}
