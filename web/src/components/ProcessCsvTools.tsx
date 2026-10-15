import { useRef, useState } from 'react'

import type { ProcessInput } from '../lib/types'
import { exportProcessesCsv, parseProcessesCsv } from '../lib/processCsv'

interface Props {
  processes: ProcessInput[]
  onImport: (processes: ProcessInput[]) => void
}

const buttonClass =
  'rounded-md border border-line px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-muted hover:text-fg'

export default function ProcessCsvTools({ processes, onImport }: Props) {
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)
    const text = await file.text()
    const { processes: parsed, error: parseError } = parseProcessesCsv(text)
    if (parseError) {
      setError(parseError)
      return
    }
    onImport(parsed)
  }

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => exportProcessesCsv(processes)}
          disabled={processes.length === 0}
          className={`${buttonClass} disabled:opacity-40`}
        >
          Export CSV
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={buttonClass}
        >
          Import CSV
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
            e.target.value = ''
          }}
        />
      </div>
      {error && (
        <p className="whitespace-pre-line text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
