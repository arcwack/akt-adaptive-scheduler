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
        running ? 'border-transparent text-white' : 'border-neutral-200 bg-white'
      }`}
      style={running ? { backgroundColor: colors[pid] ?? '#64748b' } : undefined}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: colors[pid] ?? '#94a3b8' }}
      />
      {pid}
      {remaining !== undefined && (
        <span className={running ? 'text-white/80' : 'text-neutral-400'}>
          {remaining}ms
        </span>
      )}
    </span>
  )
}

export default function ReplayPanel({ frames, decisions, pids, replay }: Props) {
  if (frames.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-400">
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
          <span className="font-mono text-xs text-neutral-500">
            t = {frame.time} / {replay.max}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => replay.step(-1)}
            className="rounded-md border border-neutral-200 px-2 py-1 text-sm hover:bg-neutral-50"
            aria-label="Step back"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={replay.toggle}
            className="rounded-md bg-neutral-900 px-3 py-1 text-sm font-medium text-white hover:bg-neutral-700"
          >
            {replay.playing ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={() => replay.step(1)}
            className="rounded-md border border-neutral-200 px-2 py-1 text-sm hover:bg-neutral-50"
            aria-label="Step forward"
          >
            ›
          </button>
          <select
            value={replay.speed}
            onChange={(e) => replay.setSpeed(Number(e.target.value))}
            className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs"
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
          <span className="text-xs text-neutral-500">Jump to switch:</span>
          {switches.map((d) => (
            <button
              key={d.time}
              type="button"
              onClick={() => replay.setTime(d.time)}
              title={d.reason}
              className="rounded border border-neutral-200 px-1.5 py-0.5 font-mono text-xs hover:border-accent hover:text-accent"
            >
              t={d.time}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 p-3">
          <div className="mb-2 text-xs font-medium text-neutral-500">Running</div>
          {frame.running ? (
            pidChip(frame.running, frame.remaining[frame.running], colors, true)
          ) : (
            <span className="text-xs text-neutral-400">idle (switch/idle)</span>
          )}
        </div>
        <div className="rounded-lg border border-neutral-200 p-3">
          <div className="mb-2 text-xs font-medium text-neutral-500">
            Ready queue
          </div>
          <div className="flex flex-wrap gap-1.5">
            {frame.ready.length === 0 ? (
              <span className="text-xs text-neutral-400">empty</span>
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
