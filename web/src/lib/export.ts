export interface ExportColumn {
  key: string
  label: string
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text =
    typeof value === 'number' ? String(value) : typeof value === 'string' ? value : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(columns: ExportColumn[], rows: Record<string, unknown>[]): string {
  const header = columns.map((c) => c.label).join(',')
  const body = rows.map((row) => columns.map((c) => csvCell(row[c.key])).join(','))
  return [header, ...body].join('\n')
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadCsv(
  basename: string,
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
): void {
  downloadFile(`${basename}.csv`, toCsv(columns, rows), 'text/csv')
}

export function downloadJson(basename: string, data: unknown): void {
  downloadFile(`${basename}.json`, JSON.stringify(data, null, 2), 'application/json')
}
