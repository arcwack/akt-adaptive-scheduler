import type {
  CaptureResult,
  Config,
  MatrixResult,
  Preset,
  ProcessInput,
  QuantumRow,
  RandomBenchmarkResult,
  RunRequest,
  RunResult,
  SweepRow,
  TradeoffPoint,
} from './types'

const BASE = '/api'

interface ValidationIssue {
  loc?: (string | number)[]
  msg?: string
}

function formatError(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'detail' in body) {
    const detail = (body as { detail: unknown }).detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail
        .map((entry) => {
          const issue = entry as ValidationIssue
          const field = Array.isArray(issue.loc)
            ? issue.loc.filter((p) => typeof p === 'string' && p !== 'body').join('.')
            : ''
          return field ? `${field}: ${issue.msg ?? 'invalid'}` : issue.msg ?? 'invalid input'
        })
        .join('\n')
    }
  }
  return `Request failed (${status})`
}

export async function runSchedule(request: RunRequest): Promise<RunResult> {
  const res = await fetch(`${BASE}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(formatError(body, res.status))
  }
  return (await res.json()) as RunResult
}

export async function runCooldownSweep(
  processes: ProcessInput[],
  config: Config,
): Promise<SweepRow[]> {
  const res = await fetch(`${BASE}/cooldown-sweep`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ processes, config, cooldowns: [0, 4, 8, 16] }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(formatError(body, res.status))
  }
  const data = (await res.json()) as { rows: SweepRow[] }
  return data.rows
}

export async function runQuantumExperiment(
  processes: ProcessInput[],
  config: Config,
): Promise<QuantumRow[]> {
  const res = await fetch(`${BASE}/quantum-sweep`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ processes, config, quanta: [2, 4, 8] }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(formatError(body, res.status))
  }
  const data = (await res.json()) as { rows: QuantumRow[] }
  return data.rows
}

export async function fetchWorkloads(): Promise<Preset[]> {
  const res = await fetch(`${BASE}/workloads`)
  if (!res.ok) {
    throw new Error(`Failed to load presets (${res.status})`)
  }
  return (await res.json()) as Preset[]
}

export async function runQuantumTradeoff(
  processes: ProcessInput[],
  config: Config,
): Promise<TradeoffPoint[]> {
  const res = await fetch(`${BASE}/quantum-tradeoff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ processes, config }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(formatError(body, res.status))
  }
  const data = (await res.json()) as { points: TradeoffPoint[] }
  return data.points
}

export async function captureProcesses(
  window: number,
  top: number,
): Promise<CaptureResult> {
  const res = await fetch(`${BASE}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ window, top }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(formatError(body, res.status))
  }
  return (await res.json()) as CaptureResult
}

export async function runBenchmarkMatrix(config: Config): Promise<MatrixResult> {
  const res = await fetch(`${BASE}/benchmark/matrix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(formatError(body, res.status))
  }
  return (await res.json()) as MatrixResult
}

export async function runBenchmarkRandom(
  config: Config,
  count: number,
  seed: number,
): Promise<RandomBenchmarkResult> {
  const res = await fetch(`${BASE}/benchmark/random`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, count, seed }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(formatError(body, res.status))
  }
  return (await res.json()) as RandomBenchmarkResult
}
