import { ALGORITHM_COLORS, colorMap } from '../lib/palette'
import type { GanttSlice } from '../lib/types'

interface Props {
  gantt: GanttSlice[]
  pids: string[]
  currentTime?: number | null
  animationKey?: number
}

interface Band {
  start: number
  end: number
  algorithm: string
}

function algorithmBands(gantt: GanttSlice[]): Band[] {
  const bands: Band[] = []
  for (const s of gantt) {
    const last = bands[bands.length - 1]
    if (last && last.algorithm === s.algorithm) {
      last.end = s.end
    } else {
      bands.push({ start: s.start, end: s.end, algorithm: s.algorithm })
    }
  }
  return bands
}

const delay = (start: number) => `${Math.min(start * 4, 200)}ms`

export default function Gantt({ gantt, pids, currentTime, animationKey }: Props) {
  if (gantt.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-subtle">
        Run a schedule to see the Gantt chart.
      </p>
    )
  }

  const total = gantt[gantt.length - 1].end || 1
  const colors = colorMap(pids)
  const bands = algorithmBands(gantt)
  const pct = (d: number) => `${(d / total) * 100}%`

  return (
    <div className="space-y-2">
      <div className="flex overflow-hidden rounded-md" aria-label="Algorithm timeline">
        {bands.map((b, i) => (
          <div
            key={`${animationKey}-${i}`}
            title={`${b.algorithm}  ${b.start}–${b.end} ms`}
            style={{
              width: pct(b.end - b.start),
              backgroundColor: ALGORITHM_COLORS[b.algorithm] ?? '#64748b',
              animationDelay: delay(b.start),
            }}
            className="gantt-segment h-2.5"
          />
        ))}
      </div>

      <div className="relative flex overflow-hidden rounded-md border border-line">
        {gantt.map((s, i) => {
          const width = pct(s.end - s.start)
          const duration = s.end - s.start
          const idle = s.pid === null
          const dim = typeof currentTime === 'number' && s.start >= currentTime
          return (
            <div
              key={`${animationKey}-${i}`}
              title={`${s.pid ?? 'idle'}  ${s.start}–${s.end} ms`}
              style={{
                width,
                backgroundColor: idle ? 'var(--line)' : colors[s.pid as string] ?? '#94a3b8',
                animationDelay: delay(s.start),
                opacity: dim ? 0.25 : 1,
              }}
              className={`gantt-segment flex h-12 items-center justify-center overflow-hidden border-r border-white/50 text-xs font-medium text-white transition-opacity duration-150 last:border-r-0 ${
                idle ? 'text-muted' : ''
              }`}
            >
              {duration >= 2 ? (idle ? 'idle' : s.pid) : ''}
            </div>
          )
        })}
        {typeof currentTime === 'number' && (
          <div
            className="pointer-events-none absolute top-0 h-full w-0.5 bg-fg transition-[left] duration-150 ease-linear"
            style={{ left: `${(currentTime / total) * 100}%` }}
          >
            <span className="absolute -left-1 -top-0.5 h-2 w-2 rotate-45 bg-fg" />
          </div>
        )}
      </div>

      <div className="flex justify-between text-xs tabular-nums text-subtle">
        <span>0 ms</span>
        <span>{total} ms</span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted">
        {Object.entries(ALGORITHM_COLORS).map(([key, color]) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {key}
          </span>
        ))}
      </div>
    </div>
  )
}
