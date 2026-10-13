import { Plus, X } from 'lucide-react'

import type { ProcessInput } from '../lib/types'

interface Props {
  processes: ProcessInput[]
  onChange: (processes: ProcessInput[]) => void
  usePriority: boolean
}

const inputClass =
  'w-full rounded-md border border-line bg-surface px-2 py-1 text-sm tabular-nums outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'

function toInt(raw: string, min: number, max: number, prev: number): number {
  if (raw.trim() === '') return prev
  const n = Math.trunc(Number(raw))
  if (!Number.isFinite(n)) return prev
  return Math.min(max, Math.max(min, n))
}

export default function ProcessTable({ processes, onChange, usePriority }: Props) {
  const grid = usePriority
    ? 'grid grid-cols-[1.4fr_1fr_1fr_1fr_auto] items-center gap-2'
    : 'grid grid-cols-[1.4fr_1fr_1fr_auto] items-center gap-2'

  const update = (index: number, patch: Partial<ProcessInput>) => {
    onChange(processes.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  const add = () => {
    onChange([
      ...processes,
      { pid: `P${processes.length + 1}`, arrival: 0, burst: 1, priority: 3 },
    ])
  }

  const remove = (index: number) => {
    onChange(processes.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <div className={`${grid} text-xs font-medium text-muted`}>
        <span>ID</span>
        <span>Arrival</span>
        <span>Burst</span>
        {usePriority && <span>Prio</span>}
        <span />
      </div>
      {processes.map((p, i) => (
        <div key={i} className={grid}>
          <input
            className={inputClass}
            value={p.pid}
            aria-label="Process ID"
            onChange={(e) => update(i, { pid: e.target.value })}
          />
          <input
            type="number"
            min={0}
            className={inputClass}
            value={p.arrival}
            aria-label="Arrival time"
            onChange={(e) =>
              update(i, { arrival: toInt(e.target.value, 0, 100000, p.arrival) })
            }
          />
          <input
            type="number"
            min={1}
            className={inputClass}
            value={p.burst}
            aria-label="Burst time"
            onChange={(e) =>
              update(i, { burst: toInt(e.target.value, 1, 100000, p.burst) })
            }
          />
          {usePriority && (
            <input
              type="number"
              min={1}
              max={5}
              className={inputClass}
              value={p.priority}
              aria-label="Priority"
              onChange={(e) =>
                update(i, { priority: toInt(e.target.value, 1, 5, p.priority) })
              }
            />
          )}
          <button
            type="button"
            onClick={() => remove(i)}
            className="rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-muted hover:text-red-600"
            aria-label={`Remove ${p.pid}`}
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-line py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <Plus size={15} strokeWidth={1.75} />
        Add process
      </button>
    </div>
  )
}
