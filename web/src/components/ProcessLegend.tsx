import { colorMap } from '../lib/palette'

interface Props {
  pids: string[]
}

export default function ProcessLegend({ pids }: Props) {
  if (pids.length === 0) return null
  const colors = colorMap(pids)
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {pids.map((pid) => (
        <span key={pid} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: colors[pid] }}
          />
          {pid}
        </span>
      ))}
    </div>
  )
}
