import { ALGORITHM_COLORS } from '../lib/palette'
import type { Frame } from '../lib/types'

interface Props {
  frames: Frame[]
  threshold: number
}

const W = 820
const H = 180
const PAD = { top: 12, right: 14, bottom: 22, left: 34 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom

function frameCv(frame: Frame): number {
  const values = frame.ready
    .map((pid) => frame.remaining[pid])
    .filter((v): v is number => typeof v === 'number')
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  if (mean <= 0) return 0
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  return Math.sqrt(variance) / mean
}

export default function CvChart({ frames, threshold }: Props) {
  if (frames.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-subtle">
        Run to see how the ready-queue CV moves against the skew threshold.
      </p>
    )
  }

  const cvs = frames.map(frameCv)
  const total = frames[frames.length - 1].time + 1
  const maxCv = Math.max(threshold * 1.3, ...cvs, 0.1)
  const x = (t: number) => PAD.left + (t / total) * PLOT_W
  const y = (v: number) => PAD.top + PLOT_H - (v / maxCv) * PLOT_H

  const bands: { start: number; end: number; algorithm: string }[] = []
  for (const f of frames) {
    const last = bands[bands.length - 1]
    if (last && last.algorithm === f.algorithm) {
      last.end = f.time + 1
    } else {
      bands.push({ start: f.time, end: f.time + 1, algorithm: f.algorithm })
    }
  }

  const line = frames
    .map((f, i) => `${x(f.time)},${y(cvs[i])}`)
    .join(' ')

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Ready-queue coefficient of variation over time"
      >
        {bands.map((b, i) => (
          <rect
            key={i}
            x={x(b.start)}
            y={PAD.top}
            width={x(b.end) - x(b.start)}
            height={PLOT_H}
            fill={ALGORITHM_COLORS[b.algorithm] ?? 'var(--muted)'}
            opacity={0.12}
          />
        ))}

        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={y(threshold)}
          y2={y(threshold)}
          stroke="var(--fg)"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          opacity={0.7}
        />
        <text x={W - PAD.right} y={y(threshold) - 4} fontSize={10} fill="var(--fg)" textAnchor="end">
          skew threshold {threshold}
        </text>

        <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth={2} />

        <text x={PAD.left} y={H - 6} fontSize={10} fill="var(--muted)">
          0
        </text>
        <text x={W - PAD.right} y={H - 6} fontSize={10} fill="var(--muted)" textAnchor="end">
          {total} ms
        </text>
      </svg>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
          CV of ready queue
        </span>
        {Object.entries(ALGORITHM_COLORS)
          .filter(([key]) => ['priority', 'srtf', 'rr'].includes(key))
          .map(([key, color]) => (
            <span key={key} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm opacity-40"
                style={{ backgroundColor: color }}
              />
              {key}
            </span>
          ))}
      </div>
    </div>
  )
}
