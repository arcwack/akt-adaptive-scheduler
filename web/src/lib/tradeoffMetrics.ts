export const Y_METRICS = [
  { key: 'avg_waiting', label: 'avg waiting (ms)', short: 'waiting' },
  { key: 'avg_response', label: 'avg response (ms)', short: 'response' },
  { key: 'avg_turnaround', label: 'avg turnaround (ms)', short: 'turnaround' },
] as const

export type TradeoffMetric = (typeof Y_METRICS)[number]['key']
