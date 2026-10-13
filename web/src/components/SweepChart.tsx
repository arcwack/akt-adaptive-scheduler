import type { SweepRow } from '../lib/types'

interface Props {
  rows: SweepRow[]
}

const W = 480
const H = 210
const PAD = { top: 16, right: 18, bottom: 34, left: 40 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom
const SWITCH_COLOR = '#2563eb'
const WAIT_COLOR = '#d97706'

export default function SweepChart({ rows }: Props) {
  if (rows.length === 0) {
    return null
  }

  const band = PLOT_W / rows.length
  const barW = band * 0.42
  const maxSwitches = Math.max(1, ...rows.map((r) => r.algorithm_switches))
  const maxWait = Math.max(1, ...rows.map((r) => r.avg_waiting))

  const barHeight = (v: number) => (v / maxSwitches) * PLOT_H
  const waitY = (v: number) => PAD.top + PLOT_H - (v / maxWait) * PLOT_H
  const centerX = (i: number) => PAD.left + band * i + band / 2
  const waitPoints = rows
    .map((r, i) => `${centerX(i)},${waitY(r.avg_waiting)}`)
    .join(' ')

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Algorithm switches and average waiting time by cooldown"
      >
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + PLOT_H * f}
            y2={PAD.top + PLOT_H * f}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        ))}

        <text
          x={PAD.left}
          y={PAD.top - 4}
          fontSize={9}
          fill={SWITCH_COLOR}
          textAnchor="start"
        >
          algorithm switches
        </text>
        <text
          x={W - PAD.right}
          y={PAD.top - 4}
          fontSize={9}
          fill={WAIT_COLOR}
          textAnchor="end"
        >
          avg waiting (ms)
        </text>

        {rows.map((r, i) => {
          const x = centerX(i) - barW / 2
          const h = barHeight(r.algorithm_switches)
          return (
            <g key={r.cooldown}>
              <rect
                x={x}
                y={PAD.top + PLOT_H - h}
                width={barW}
                height={h}
                fill={SWITCH_COLOR}
                rx={2}
              />
              <text
                x={centerX(i)}
                y={PAD.top + PLOT_H - h - 4}
                fontSize={10}
                fill={SWITCH_COLOR}
                textAnchor="middle"
              >
                {r.algorithm_switches}
              </text>
              <text
                x={centerX(i)}
                y={H - PAD.bottom + 16}
                fontSize={11}
                fill="#525252"
                textAnchor="middle"
              >
                {r.cooldown} ms
              </text>
            </g>
          )
        })}

        <polyline
          points={waitPoints}
          fill="none"
          stroke={WAIT_COLOR}
          strokeWidth={2}
        />
        {rows.map((r, i) => (
          <g key={`w-${r.cooldown}`}>
            <circle cx={centerX(i)} cy={waitY(r.avg_waiting)} r={3.5} fill={WAIT_COLOR} />
            <text
              x={centerX(i)}
              y={waitY(r.avg_waiting) - 7}
              fontSize={10}
              fill={WAIT_COLOR}
              textAnchor="middle"
            >
              {r.avg_waiting.toFixed(1)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
