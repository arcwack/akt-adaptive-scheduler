import type { Metrics } from './types'

export interface MetricDef {
  key: keyof Metrics
  label: string
  dir: 'min' | 'max'
  fmt: (value: number) => string
}

export const BENCH_METRICS: MetricDef[] = [
  { key: 'avg_waiting', label: 'Avg waiting', dir: 'min', fmt: (v) => v.toFixed(2) },
  { key: 'avg_turnaround', label: 'Avg turnaround', dir: 'min', fmt: (v) => v.toFixed(2) },
  { key: 'avg_response', label: 'Avg response', dir: 'min', fmt: (v) => v.toFixed(2) },
  { key: 'context_switches', label: 'Context switches', dir: 'min', fmt: (v) => String(v) },
  { key: 'max_waiting', label: 'Max waiting', dir: 'min', fmt: (v) => String(v) },
  { key: 'cpu_utilization', label: 'CPU utilisation', dir: 'max', fmt: (v) => `${(v * 100).toFixed(1)}%` },
]

export function metricDef(key: string): MetricDef {
  return BENCH_METRICS.find((m) => m.key === key) ?? BENCH_METRICS[0]
}

export function metricValue(metrics: Metrics, key: keyof Metrics): number {
  return metrics[key] as number
}

export function bestValue(values: number[], dir: 'min' | 'max'): number {
  return dir === 'min' ? Math.min(...values) : Math.max(...values)
}

export function isBest(value: number, best: number, dir: 'min' | 'max'): boolean {
  return dir === 'min' ? value <= best + 1e-9 : value >= best - 1e-9
}
