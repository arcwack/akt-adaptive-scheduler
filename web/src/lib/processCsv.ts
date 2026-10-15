import { downloadCsv, type ExportColumn } from './export'
import type { ProcessInput } from './types'

const COLUMNS: ExportColumn[] = [
  { key: 'pid', label: 'id' },
  { key: 'arrival', label: 'arrival' },
  { key: 'burst', label: 'burst' },
  { key: 'priority', label: 'priority' },
]

export function exportProcessesCsv(processes: ProcessInput[]): void {
  downloadCsv('processes', COLUMNS, processes as unknown as Record<string, unknown>[])
}

export interface ParseResult {
  processes: ProcessInput[]
  error: string | null
}

export function parseProcessesCsv(text: string): ParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) {
    return { processes: [], error: 'File is empty.' }
  }
  const header = lines[0].toLowerCase().replace(/\s+/g, '')
  if (header !== 'id,arrival,burst,priority') {
    return { processes: [], error: 'Header must be: id,arrival,burst,priority' }
  }

  const processes: ProcessInput[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i += 1) {
    const rowNo = i + 1
    const cols = lines[i].split(',').map((c) => c.trim())
    const rowErrors: string[] = []
    if (cols.length !== 4) {
      errors.push(`Row ${rowNo}: expected 4 columns, got ${cols.length}`)
      continue
    }
    const [id, arrivalRaw, burstRaw, priorityRaw] = cols
    const arrival = Number(arrivalRaw)
    const burst = Number(burstRaw)
    const priority = Number(priorityRaw)

    if (!id) rowErrors.push(`Row ${rowNo}: id is required`)
    if (!Number.isInteger(arrival) || arrival < 0)
      rowErrors.push(`Row ${rowNo}: arrival must be an integer >= 0`)
    if (!Number.isInteger(burst) || burst < 1)
      rowErrors.push(`Row ${rowNo}: burst must be an integer >= 1`)
    if (!Number.isInteger(priority) || priority < 1 || priority > 5)
      rowErrors.push(`Row ${rowNo}: priority must be an integer 1-5`)

    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
      continue
    }
    processes.push({ pid: id, arrival, burst, priority })
  }

  if (errors.length > 0) {
    return { processes: [], error: errors.join('\n') }
  }
  if (processes.length === 0) {
    return { processes: [], error: 'No data rows found.' }
  }
  return { processes, error: null }
}
