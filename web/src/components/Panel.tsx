import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export default function Panel({ title, description, actions, children }: Props) {
  return (
    <section className="rounded-xl border border-line bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && (
            <p className="text-xs text-muted">{description}</p>
          )}
        </div>
        {actions}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}
