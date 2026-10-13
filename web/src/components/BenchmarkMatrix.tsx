import { bestValue, isBest, metricDef, metricValue } from '../lib/benchmarkMetrics'
import { algorithmLabel, type MatrixResult } from '../lib/types'

interface Props {
  matrix: MatrixResult
  metricKey: string
}

export default function BenchmarkMatrix({ matrix, metricKey }: Props) {
  const metric = metricDef(metricKey)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            <th className="px-3 py-2 font-medium">Workload</th>
            {matrix.algorithms.map((key) => (
              <th key={key} className="px-3 py-2 text-right font-medium">
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
            const best = bestValue(values, metric.dir)
            return (
              <tr key={row.workload} className="border-b border-line-soft last:border-0">
                <td className="px-3 py-2">{row.workload}</td>
                {matrix.algorithms.map((key, i) => {
                  const value = values[i]
                  return (
                    <td
                      key={key}
                      className={`px-3 py-2 text-right tabular-nums ${
                        isBest(value, best, metric.dir)
                          ? 'font-semibold text-emerald-500'
                          : ''
                      }`}
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
    </div>
  )
}
