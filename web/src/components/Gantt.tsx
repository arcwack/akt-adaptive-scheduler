import { ALGORITHM_COLORS, IDLE_COLOR, colorMap } from '../lib/palette'
import type { GanttSlice } from '../lib/types'

interface Props {
  gantt: GanttSlice[]
  pids: string[]
  currentTime?: number | null
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

export default function Gantt({ gantt, pids, currentTime }: Props) {
  if (gantt.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-neutral-400">
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
            key={i}
            title={`${b.algorithm}  ${b.start}–${b.end} ms`}
            style={{
              width: pct(b.end - b.start),
              backgroundColor: ALGORITHM_COLORS[b.algorithm] ?? '#64748b',
            }}
            className="h-2.5"
          />
        ))}
      </div>

      <div className="relative flex overflow-hidden rounded-md border border-neutral-200">
        {gantt.map((s, i) => {
          const width = pct(s.end - s.start)
          const duration = s.end - s.start
          return (
            <div
              key={i}
              title={`${s.pid ?? 'idle'}  ${s.start}–${s.end} ms`}
              style={{
                width,
                backgroundColor: s.pid ? colors[s.pid] ?? '#94a3b8' : IDLE_COLOR,
              }}
              className="flex h-12 items-center justify-center overflow-hidden border-r border-white/40 text-xs font-medium text-white last:border-r-0"
            >
              {duration >= 2 && s.pid ? s.pid : ''}
            </div>
          )
        })}
        {typeof currentTime === 'number' && (
          <div
            className="pointer-events-none absolute top-0 h-full w-px bg-neutral-900"
            style={{ left: `${(currentTime / total) * 100}%` }}
          />
        )}
      </div>

      <div className="flex justify-between text-xs tabular-nums text-neutral-400">
        <span>0 ms</span>
        <span>{total} ms</span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-neutral-500">
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
