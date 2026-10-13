import type { Config, ProcessInput } from './types'

export interface Preset {
  name: string
  processes: ProcessInput[]
  usePriority: boolean
  config?: Partial<Config>
}

export const PRESETS: Preset[] = [
  {
    name: 'Thrashing (mixed short+long)',
    usePriority: false,
    processes: [
      { pid: 'P1', arrival: 0, burst: 2, priority: 3 },
      { pid: 'P2', arrival: 0, burst: 2, priority: 3 },
      { pid: 'P3', arrival: 1, burst: 10, priority: 3 },
      { pid: 'P4', arrival: 2, burst: 2, priority: 3 },
      { pid: 'P5', arrival: 3, burst: 10, priority: 3 },
      { pid: 'P6', arrival: 4, burst: 2, priority: 3 },
      { pid: 'P7', arrival: 5, burst: 10, priority: 3 },
      { pid: 'P8', arrival: 6, burst: 2, priority: 3 },
    ],
  },
  {
    name: 'Mixed short & long',
    usePriority: false,
    processes: [
      { pid: 'P1', arrival: 0, burst: 20, priority: 3 },
      { pid: 'P2', arrival: 1, burst: 2, priority: 3 },
      { pid: 'P3', arrival: 2, burst: 18, priority: 3 },
      { pid: 'P4', arrival: 3, burst: 3, priority: 3 },
      { pid: 'P5', arrival: 4, burst: 15, priority: 3 },
      { pid: 'P6', arrival: 5, burst: 2, priority: 3 },
    ],
  },
  {
    name: 'Mostly short jobs',
    usePriority: false,
    processes: [
      { pid: 'P1', arrival: 0, burst: 1, priority: 3 },
      { pid: 'P2', arrival: 1, burst: 2, priority: 3 },
      { pid: 'P3', arrival: 2, burst: 1, priority: 3 },
      { pid: 'P4', arrival: 3, burst: 3, priority: 3 },
      { pid: 'P5', arrival: 4, burst: 2, priority: 3 },
      { pid: 'P6', arrival: 5, burst: 1, priority: 3 },
      { pid: 'P7', arrival: 6, burst: 2, priority: 3 },
      { pid: 'P8', arrival: 7, burst: 1, priority: 3 },
    ],
  },
  {
    name: 'Mostly long jobs',
    usePriority: false,
    processes: [
      { pid: 'P1', arrival: 0, burst: 20, priority: 3 },
      { pid: 'P2', arrival: 1, burst: 15, priority: 3 },
      { pid: 'P3', arrival: 2, burst: 18, priority: 3 },
      { pid: 'P4', arrival: 3, burst: 12, priority: 3 },
    ],
  },
  {
    name: 'Bursty arrivals',
    usePriority: false,
    processes: [
      { pid: 'P1', arrival: 0, burst: 3, priority: 3 },
      { pid: 'P2', arrival: 0, burst: 4, priority: 3 },
      { pid: 'P3', arrival: 0, burst: 2, priority: 3 },
      { pid: 'P4', arrival: 12, burst: 5, priority: 3 },
      { pid: 'P5', arrival: 12, burst: 3, priority: 3 },
      { pid: 'P6', arrival: 13, burst: 4, priority: 3 },
      { pid: 'P7', arrival: 25, burst: 2, priority: 3 },
      { pid: 'P8', arrival: 25, burst: 6, priority: 3 },
    ],
  },
  {
    name: 'Urgent processes',
    usePriority: true,
    processes: [
      { pid: 'P1', arrival: 0, burst: 8, priority: 3 },
      { pid: 'P2', arrival: 1, burst: 6, priority: 3 },
      { pid: 'P3', arrival: 2, burst: 4, priority: 5 },
      { pid: 'P4', arrival: 3, burst: 5, priority: 3 },
      { pid: 'P5', arrival: 6, burst: 7, priority: 5 },
      { pid: 'P6', arrival: 8, burst: 3, priority: 2 },
    ],
  },
  {
    name: 'Uniform jobs',
    usePriority: false,
    processes: [
      { pid: 'P1', arrival: 0, burst: 5, priority: 3 },
      { pid: 'P2', arrival: 1, burst: 5, priority: 3 },
      { pid: 'P3', arrival: 2, burst: 5, priority: 3 },
      { pid: 'P4', arrival: 3, burst: 5, priority: 3 },
      { pid: 'P5', arrival: 4, burst: 5, priority: 3 },
      { pid: 'P6', arrival: 5, burst: 5, priority: 3 },
    ],
  },
  {
    name: 'Classic textbook',
    usePriority: true,
    processes: [
      { pid: 'P1', arrival: 0, burst: 8, priority: 2 },
      { pid: 'P2', arrival: 1, burst: 4, priority: 4 },
      { pid: 'P3', arrival: 2, burst: 9, priority: 1 },
      { pid: 'P4', arrival: 3, burst: 5, priority: 3 },
    ],
  },
]
