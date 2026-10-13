const PALETTE = [
  '#2563eb',
  '#16a34a',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#4d7c0f',
  '#ea580c',
  '#0f766e',
]

export const IDLE_COLOR = '#e5e7eb'

export function colorMap(pids: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  pids.forEach((pid, i) => {
    map[pid] = PALETTE[i % PALETTE.length]
  })
  return map
}

export const ALGORITHM_COLORS: Record<string, string> = {
  priority: '#dc2626',
  srtf: '#d97706',
  rr: '#2563eb',
  fcfs: '#64748b',
  sjf: '#7c3aed',
  adaptive: '#0f766e',
}
