import { useState } from 'react'

import { runBenchmarkMatrix, runBenchmarkRandom } from '../lib/api'
import { BENCH_METRICS } from '../lib/benchmarkMetrics'
import type { Config, MatrixResult, RandomBenchmarkResult } from '../lib/types'
import BenchmarkMatrix from './BenchmarkMatrix'
import BenchmarkRandom from './BenchmarkRandom'
import Panel from './Panel'

interface Props {
  config: Config
}

const inputClass =
  'w-full rounded-md border border-line bg-surface px-2 py-1 text-sm tabular-nums outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'

export default function BenchmarkPanel({ config }: Props) {
  const [matrix, setMatrix] = useState<MatrixResult | null>(null)
  const [random, setRandom] = useState<RandomBenchmarkResult | null>(null)
  const [metricKey, setMetricKey] = useState('avg_waiting')
  const [count, setCount] = useState(100)
  const [seed, setSeed] = useState(42)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const [m, r] = await Promise.all([
        runBenchmarkMatrix(config),
        runBenchmarkRandom(config, count, seed),
      ])
      setMatrix(m)
      setRandom(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Panel
      title="Workload benchmark"
      description="Preset matrix and seeded random workloads across all six algorithms"
      actions={
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="rounded-md border border-line px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-muted disabled:opacity-50"
        >
          {loading ? 'Benchmarking…' : 'Run benchmark'}
        </button>
      }
    >
      {error && <p className="mb-3 whitespace-pre-line text-sm text-red-500">{error}</p>}

      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium text-muted">Matrix metric</span>
        <select
          value={metricKey}
          onChange={(e) => setMetricKey(e.target.value)}
          className="rounded-md border border-line bg-surface px-2 py-1 text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          aria-label="Matrix metric"
        >
          {BENCH_METRICS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {matrix ? (
        <BenchmarkMatrix matrix={matrix} metricKey={metricKey} />
      ) : (
        <p className="py-6 text-center text-sm text-subtle">
          Run the benchmark to fill the matrix (best value per row in green).
        </p>
      )}

      <div className="my-4 border-t border-line-soft" />

      <div className="mb-3 flex flex-wrap items-end gap-3">
        <label className="space-y-1">
          <span className="block text-xs font-medium text-muted">Workloads</span>
          <input
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
            className={`${inputClass} w-24`}
          />
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-medium text-muted">Seed</span>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value) || 0)}
            className={`${inputClass} w-24`}
          />
        </label>
        <p className="text-xs text-subtle">Same seed gives the same results.</p>
      </div>

      {random ? (
        <BenchmarkRandom result={random} />
      ) : (
        <p className="py-6 text-center text-sm text-subtle">
          The random benchmark reports mean metrics and how often Adaptive wins.
        </p>
      )}
    </Panel>
  )
}
