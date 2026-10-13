import { downloadCsv, downloadJson, type ExportColumn } from '../lib/export'

interface Props {
  basename: string
  columns: ExportColumn[]
  rows: Record<string, unknown>[]
  json: unknown
  disabled?: boolean
}

const buttonClass =
  'rounded-md border border-line px-2 py-1 text-xs font-medium hover:bg-surface-muted disabled:opacity-40'

export default function ExportButtons({
  basename,
  columns,
  rows,
  json,
  disabled,
}: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={disabled || rows.length === 0}
        onClick={() => downloadCsv(basename, columns, rows)}
        className={buttonClass}
      >
        CSV
      </button>
      <button
        type="button"
        disabled={disabled || rows.length === 0}
        onClick={() => downloadJson(basename, json)}
        className={buttonClass}
      >
        JSON
      </button>
    </div>
  )
}
