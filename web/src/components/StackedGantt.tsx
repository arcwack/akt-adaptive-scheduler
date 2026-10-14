import { ALGORITHM_COLORS, colorMap } from '../lib/palette'
import type { GanttSlice } from '../lib/types'

export interface GanttRow {
  key: string
  label: string
  gantt: GanttSlice[]
}

interface Props {
  rows: GanttRow[]
  pids: string[]
  showDuration?: boolean
}

export default function StackedGantt({ rows, pids, showDuration }: Props) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-subtle">
        Run to stack every algorithm on one time axis.
      </p>
    )
  }

  const total =
    Math.max(1, ...rows.map((r) => r.gantt[r.gantt.length - 1]?.end ?? 0))
  const colors = colorMap(pids)
  const pct = (d: number) => `${(d / total) * 100}%`

  return (
    <div className="space-y-1.5">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-3">
          <span
            className="w-24 shrink-0 truncate text-xs font-medium"
            style={{ color: ALGORITHM_COLORS[row.key] ?? 'var(--fg)' }}
          >
            {row.label}
          </span>
          <div className="flex h-6 flex-1 overflow-hidden rounded-md border border-line">
            {row.gantt.map((s, i) => {
              const duration = s.end - s.start
              return (
                <div
                  key={i}
                  title={`${row.label} · ${s.pid ?? 'idle'} ${s.start}–${s.end} ms`}
                  style={{
                    width: pct(duration),
                    backgroundColor: s.pid ? colors[s.pid] ?? '#94a3b8' : 'var(--line)',
                  }}
                  className="flex h-full items-center justify-center overflow-hidden border-r border-white/40 text-[10px] font-medium text-white last:border-r-0"
                >
                  {showDuration && s.pid && duration >= 2 ? duration : ''}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <div className="flex justify-between pl-[6.75rem] text-xs tabular-nums text-subtle">
        <span>0 ms</span>
        <span>{total} ms</span>
      </div>
    </div>
  )
}
