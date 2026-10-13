import { ALGORITHM_COLORS } from '../lib/palette'
import type { Decision } from '../lib/types'

interface Props {
  decisions: Decision[]
}

export default function DecisionLog({ decisions }: Props) {
  if (decisions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-subtle">
        Decisions and switches will appear here.
      </p>
    )
  }

  const switches = decisions.filter((d) => d.switched)

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        {switches.length} algorithm switch{switches.length === 1 ? '' : 'es'}
      </p>
      <ol className="space-y-2">
        {decisions.map((d, i) => {
          const aging = d.reason.startsWith('aging')
          return (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 w-14 shrink-0 font-mono text-xs text-subtle">
                t={d.time}
              </span>
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: aging
                    ? '#d97706'
                    : ALGORITHM_COLORS[d.algorithm] ?? '#94a3b8',
                }}
              />
              <span className={d.switched ? 'font-medium' : 'text-muted'}>
                {aging && (
                  <span className="mr-1.5 rounded bg-amber-500/15 px-1.5 py-0.5 text-xs font-medium text-amber-500">
                    aging
                  </span>
                )}
                <span className="capitalize">{d.algorithm}</span>
                {' — '}
                {d.reason}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
