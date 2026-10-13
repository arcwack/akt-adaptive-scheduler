import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'

import { ALGORITHM_COLORS, colorMap } from '../lib/palette'
import type { Decision, Frame } from '../lib/types'
import type { Replay } from '../lib/useReplay'

interface Props {
  frames: Frame[]
  decisions: Decision[]
  pids: string[]
  replay: Replay
}

const SPEEDS = [0.5, 1, 2, 4]

function pidChip(
  pid: string,
  remaining: number | undefined,
  colors: Record<string, string>,
  running: boolean,
) {
  return (
    <span
      key={pid}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
        running ? 'border-transparent text-white' : 'border-line bg-surface'
      }`}
      style={running ? { backgroundColor: colors[pid] ?? '#64748b' } : undefined}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: colors[pid] ?? '#94a3b8' }}
      />
      {pid}
      {remaining !== undefined && (
        <span className={running ? 'text-white/80' : 'text-subtle'}>
          {remaining}ms
        </span>
      )}
    </span>
  )
}

export default function ReplayPanel({ frames, decisions, pids, replay }: Props) {
  if (frames.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-subtle">
        Run a schedule to step through time.
      </p>
    )
  }

  const frame = frames[Math.min(replay.time, frames.length - 1)]
  const colors = colorMap(pids)
  const switches = decisions.filter((d) => d.switched)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: ALGORITHM_COLORS[frame.algorithm] ?? '#64748b' }}
          >
            {frame.algorithm}
          </span>
          <span className="font-mono text-xs text-muted">
            t = {frame.time} / {replay.max}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => replay.step(-1)}
            className="rounded-md border border-line p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-fg"
            aria-label="Step back"
          >
            <SkipBack size={16} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={replay.toggle}
            className="inline-flex items-center gap-1.5 rounded-md bg-fg px-3 py-1.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
          >
            {replay.playing ? (
              <Pause size={15} strokeWidth={1.75} />
            ) : (
              <Play size={15} strokeWidth={1.75} />
            )}
            {replay.playing ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={() => replay.step(1)}
            className="rounded-md border border-line p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-fg"
            aria-label="Step forward"
          >
            <SkipForward size={16} strokeWidth={1.75} />
          </button>
          <select
            value={replay.speed}
            onChange={(e) => replay.setSpeed(Number(e.target.value))}
            className="rounded-md border border-line bg-surface px-2 py-1 text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            aria-label="Playback speed"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={replay.max}
        value={replay.time}
        onChange={(e) => replay.setTime(Number(e.target.value))}
        className="w-full accent-accent"
        aria-label="Replay time"
      />

      {switches.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted">Jump to switch:</span>
          {switches.map((d) => (
            <button
              key={d.time}
              type="button"
              onClick={() => replay.setTime(d.time)}
              title={d.reason}
              className="rounded border border-line px-1.5 py-0.5 font-mono text-xs hover:border-accent hover:text-accent"
            >
              t={d.time}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-line p-3">
          <div className="mb-2 text-xs font-medium text-muted">Running</div>
          {frame.running ? (
            pidChip(frame.running, frame.remaining[frame.running], colors, true)
          ) : (
            <span className="text-xs text-subtle">idle (switch/idle)</span>
          )}
        </div>
        <div className="rounded-lg border border-line p-3">
          <div className="mb-2 text-xs font-medium text-muted">
            Ready queue
          </div>
          <div className="flex flex-wrap gap-1.5">
            {frame.ready.length === 0 ? (
              <span className="text-xs text-subtle">empty</span>
            ) : (
              frame.ready.map((pid) =>
                pidChip(pid, frame.remaining[pid], colors, false),
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
