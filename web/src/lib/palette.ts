const PALETTE = [
  '#0f766e',
  '#16a34a',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#db2777',
  '#0891b2',
  '#4d7c0f',
  '#ea580c',
  '#a16207',
]

export function colorMap(pids: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  pids.forEach((pid, i) => {
    map[pid] = PALETTE[i % PALETTE.length]
  })
  return map
}

export const ALGORITHM_COLORS: Record<string, string> = {
  adaptive: 'var(--accent)',
  priority: '#dc2626',
  srtf: '#d97706',
  rr: '#7c3aed',
  fcfs: '#64748b',
  sjf: '#0891b2',
}

export const MUTED_BAR = 'var(--muted)'
