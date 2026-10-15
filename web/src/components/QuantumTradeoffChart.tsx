import type { TradeoffPoint } from '../lib/types'
import { Y_METRICS, type TradeoffMetric } from '../lib/tradeoffMetrics'

interface Props {
  points: TradeoffPoint[]
  metricKey: TradeoffMetric
}

const W = 760
const H = 300
const PAD = { top: 20, right: 24, bottom: 34, left: 52 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom
const FIXED_COLOR = 'var(--muted)'
const DYNAMIC_COLOR = 'var(--accent)'
const LINE_COLOR = 'var(--line)'

export default function QuantumTradeoffChart({ points, metricKey }: Props) {
  const metric = Y_METRICS.find((m) => m.key === metricKey) ?? Y_METRICS[0]
  const fixed = points
    .filter((p) => !p.dynamic)
    .sort((a, b) => (a.quantum ?? 0) - (b.quantum ?? 0))
  const dynamic = points.find((p) => p.dynamic) ?? null
  const all = dynamic ? [...fixed, dynamic] : fixed
  if (all.length === 0) return null

  const xMax = Math.max(1, ...all.map((p) => p.context_switches)) * 1.05
  const yMax = Math.max(1, ...all.map((p) => p[metricKey])) * 1.12

  const px = (cs: number) => PAD.left + (cs / xMax) * PLOT_W
  const py = (v: number) => PAD.top + PLOT_H - (v / yMax) * PLOT_H

  const fixedLine = fixed.map((p) => `${px(p.context_switches)},${py(p[metricKey])}`).join(' ')

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Context switches versus waiting trade-off across quanta"
      >
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + PLOT_H * f}
            y2={PAD.top + PLOT_H * f}
            stroke={LINE_COLOR}
            strokeWidth={1}
          />
        ))}

        <text x={PAD.left} y={PAD.top - 6} fontSize={11} fill="var(--muted)">
          {metric.label}
        </text>

        {fixed.length > 1 && (
          <polyline points={fixedLine} fill="none" stroke={FIXED_COLOR} strokeWidth={1.5} opacity={0.7} />
        )}

        {fixed.map((p) => (
          <g key={p.quantum}>
            <circle cx={px(p.context_switches)} cy={py(p[metricKey])} r={3.5} fill={FIXED_COLOR} />
            <text
              x={px(p.context_switches)}
              y={py(p[metricKey]) - 7}
              fontSize={10}
              fill="var(--muted)"
              textAnchor="middle"
            >
              {p.quantum}
            </text>
          </g>
        ))}

        {dynamic && (
          <g>
            <circle
              cx={px(dynamic.context_switches)}
              cy={py(dynamic[metricKey])}
              r={6}
              fill={DYNAMIC_COLOR}
            />
            <text
              x={px(dynamic.context_switches)}
              y={py(dynamic[metricKey]) - 10}
              fontSize={11}
              fill={DYNAMIC_COLOR}
              textAnchor="middle"
              fontWeight={600}
            >
              Dynamic
            </text>
          </g>
        )}

        <text x={PAD.left} y={H - 8} fontSize={11} fill="var(--muted)">
          context switches →
        </text>
      </svg>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: FIXED_COLOR }} />
          Fixed quantum 1–16
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: DYNAMIC_COLOR }} />
          Dynamic
        </span>
        <span className="text-subtle">bottom-left is better (fewer switches, lower {metric.short})</span>
      </div>
    </div>
  )
}
