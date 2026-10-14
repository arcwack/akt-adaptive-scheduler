import { metricDef, metricValue } from '../lib/benchmarkMetrics'
import { algorithmLabel, type MatrixResult } from '../lib/types'

interface Props {
  matrix: MatrixResult
  metricKey: string
}

export default function BenchmarkMatrix({ matrix, metricKey }: Props) {
  const metric = metricDef(metricKey)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="px-2 py-1 font-medium">Workload</th>
            {matrix.algorithms.map((key) => (
              <th
                key={key}
                className={`px-2 py-1 text-center font-medium ${
                  key === 'adaptive' ? 'text-accent' : ''
                }`}
              >
                {algorithmLabel(key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.rows.map((row) => {
            const values = matrix.algorithms.map((key) =>
              metricValue(row.cells[key], metric.key),
            )
            const min = Math.min(...values)
            const max = Math.max(...values)
            return (
              <tr key={row.workload}>
                <td className="whitespace-nowrap px-2 py-1 text-xs">{row.workload}</td>
                {matrix.algorithms.map((key, i) => {
                  const value = values[i]
                  const norm = max > min ? (value - min) / (max - min) : 1
                  const goodness = metric.dir === 'min' ? 1 - norm : norm
                  const alpha = 0.1 + goodness * 0.75
                  return (
                    <td
                      key={key}
                      title={`${algorithmLabel(key)} · ${metric.label}: ${metric.fmt(value)}`}
                      className="rounded-md px-2 py-1.5 text-center tabular-nums"
                      style={{
                        backgroundColor: `color-mix(in srgb, var(--accent) ${(alpha * 100).toFixed(0)}%, transparent)`,
                        color: alpha > 0.55 ? '#fff' : 'var(--fg)',
                      }}
                    >
                      {metric.fmt(value)}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-subtle">
        Darker = better ({metric.dir === 'min' ? 'lower' : 'higher'} {metric.label.toLowerCase()}).
      </p>
    </div>
  )
}
