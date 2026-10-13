import type { Config } from '../lib/types'

interface Props {
  config: Config
  onChange: (config: Config) => void
}

const FIELDS: { key: keyof Config; label: string; step: number; min: number }[] = [
  { key: 'skew_threshold', label: 'Skew threshold', step: 0.05, min: 0 },
  { key: 'cooldown', label: 'Cooldown (ms)', step: 1, min: 0 },
  { key: 'aging_factor', label: 'Aging factor', step: 0.5, min: 0 },
  { key: 'critical_priority', label: 'Critical priority', step: 1, min: 1 },
  { key: 'priority_cap', label: 'Priority cap (ms)', step: 1, min: 1 },
  { key: 'quantum_min', label: 'Min quantum (ms)', step: 1, min: 1 },
  { key: 'quantum_max', label: 'Max quantum (ms)', step: 1, min: 1 },
  { key: 'switch_penalty', label: 'Switch penalty (ms)', step: 1, min: 0 },
]

const inputClass =
  'w-full rounded-md border border-line bg-surface px-2 py-1 text-sm tabular-nums outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'

function toNumber(raw: string, min: number, prev: number): number {
  if (raw.trim() === '') return prev
  const n = Number(raw)
  if (!Number.isFinite(n)) return prev
  return Math.max(min, n)
}

export default function ThresholdPanel({ config, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-x-3 gap-y-3">
        {FIELDS.map(({ key, label, step, min }) => (
          <label key={key} className="block space-y-1">
            <span className="text-xs font-medium text-muted">{label}</span>
            <input
              type="number"
              step={step}
              min={min}
              className={inputClass}
              value={config[key] as number}
              onChange={(e) =>
                onChange({
                  ...config,
                  [key]: toNumber(e.target.value, min, config[key] as number),
                })
              }
            />
          </label>
        ))}
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted">
            Fixed quantum
          </span>
          <input
            type="number"
            min={1}
            placeholder="dynamic"
            className={inputClass}
            value={config.fixed_quantum ?? ''}
            onChange={(e) =>
              onChange({
                ...config,
                fixed_quantum:
                  e.target.value.trim() === ''
                    ? null
                    : toNumber(e.target.value, 1, config.fixed_quantum ?? 1),
              })
            }
          />
        </label>
      </div>
      <p className="text-xs leading-relaxed text-subtle">
        Leave fixed quantum empty to use the dynamic median-based quantum.
      </p>
    </div>
  )
}
