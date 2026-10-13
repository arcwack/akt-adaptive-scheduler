import { BENCH_METRICS, bestValue, isBest, metricValue } from '../lib/benchmarkMetrics'
import { algorithmLabel, type RandomBenchmarkResult } from '../lib/types'

interface Props {
  result: RandomBenchmarkResult
}

export default function BenchmarkRandom({ result }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        {result.count} random workloads, seed {result.seed} — mean metrics per algorithm.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="px-3 py-2 font-medium">Algorithm</th>
              {BENCH_METRICS.map((m) => (
                <th key={m.key} className="px-3 py-2 text-right font-medium">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.algorithms.map((key) => (
              <tr
                key={key}
                className={`border-b border-line-soft last:border-0 ${
                  key === 'adaptive' ? 'bg-accent-soft font-medium' : ''
                }`}
              >
                <td className="px-3 py-2">{algorithmLabel(key)}</td>
                {BENCH_METRICS.map((m) => {
                  const values = result.algorithms.map((a) =>
                    metricValue(result.means[a], m.key),
                  )
                  const best = bestValue(values, m.dir)
                  const value = metricValue(result.means[key], m.key)
                  return (
                    <td
                      key={m.key}
                      className={`px-3 py-2 text-right tabular-nums ${
                        isBest(value, best, m.dir) ? 'font-semibold text-emerald-500' : ''
                      }`}
                    >
                      {m.fmt(value)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted">
          Adaptive had the best (or tied) value on:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {BENCH_METRICS.map((m) => {
            const rate = result.adaptive_best[m.key] ?? 0
            return (
              <span
                key={m.key}
                className="rounded-md border border-line px-2 py-1 text-xs text-muted"
              >
                {m.label}{' '}
                <span className="font-semibold text-fg">
                  {(rate * 100).toFixed(0)}%
                </span>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
