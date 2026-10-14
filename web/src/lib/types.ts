export interface ProcessInput {
  pid: string
  arrival: number
  burst: number
  priority: number
}

export interface Config {
  critical_priority: number
  skew_threshold: number
  cooldown: number
  aging_factor: number
  priority_cap: number
  quantum_min: number
  quantum_max: number
  fixed_quantum: number | null
  switch_penalty: number
}

export interface RunRequest {
  processes: ProcessInput[]
  algorithm: string
  config: Config
}

export interface GanttSlice {
  start: number
  end: number
  pid: string | null
  algorithm: string
}

export interface Metrics {
  avg_waiting: number
  avg_turnaround: number
  avg_response: number
  cpu_utilization: number
  context_switches: number
  algorithm_switches: number
  max_waiting: number
  makespan: number
}

export interface Decision {
  time: number
  algorithm: string
  reason: string
  switched: boolean
}

export interface ProcessResult {
  pid: string
  arrival: number
  burst: number
  priority: number
  first_run: number
  finish: number
  waiting: number
  turnaround: number
  response: number
}

export interface Frame {
  time: number
  running: string | null
  ready: string[]
  algorithm: string
  remaining: Record<string, number>
}

export interface RoundInfo {
  round: number
  time: number
  remaining: number[]
  median: number
  quantum: number
  dynamic: boolean
}

export interface RunResult {
  algorithm: string
  gantt: GanttSlice[]
  metrics: Metrics
  decisions: Decision[]
  processes: ProcessResult[]
  frames: Frame[]
  rounds: RoundInfo[]
}

export interface SweepRow {
  cooldown: number
  algorithm_switches: number
  context_switches: number
  avg_waiting: number
  avg_turnaround: number
}

export interface QuantumRow {
  label: string
  quantum: number | null
  dynamic: boolean
  avg_waiting: number
  avg_turnaround: number
  avg_response: number
  context_switches: number
  algorithm_switches: number
  max_waiting: number
}

export interface Preset {
  name: string
  use_priority: boolean
  config: Partial<Config>
  processes: ProcessInput[]
}

export interface MatrixRow {
  workload: string
  cells: Record<string, Metrics>
}

export interface MatrixResult {
  algorithms: string[]
  rows: MatrixRow[]
}

export interface RandomBenchmarkResult {
  count: number
  seed: number
  algorithms: string[]
  metrics: Record<string, 'min' | 'max'>
  means: Record<string, Metrics>
  adaptive_best: Record<string, number>
}

export const ALGORITHMS: { key: string; label: string }[] = [
  { key: 'adaptive', label: 'Adaptive' },
  { key: 'fcfs', label: 'FCFS' },
  { key: 'sjf', label: 'SJF' },
  { key: 'srtf', label: 'SRTF' },
  { key: 'rr', label: 'Round Robin' },
  { key: 'priority', label: 'Priority' },
]

export function algorithmLabel(key: string): string {
  return ALGORITHMS.find((a) => a.key === key)?.label ?? key
}

export const DEFAULT_CONFIG: Config = {
  critical_priority: 4,
  skew_threshold: 0.6,
  cooldown: 8,
  aging_factor: 3.5,
  priority_cap: 20,
  quantum_min: 2,
  quantum_max: 16,
  fixed_quantum: null,
  switch_penalty: 1,
}

export const DEMO_PROCESSES: ProcessInput[] = [
  { pid: 'P1', arrival: 0, burst: 8, priority: 2 },
  { pid: 'P2', arrival: 1, burst: 4, priority: 4 },
  { pid: 'P3', arrival: 2, burst: 9, priority: 1 },
  { pid: 'P4', arrival: 3, burst: 5, priority: 3 },
]
