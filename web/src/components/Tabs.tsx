interface Props {
  tabs: { key: string; label: string }[]
  active: string
  onChange: (key: string) => void
}

export default function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div
      role="tablist"
      className="flex gap-1 rounded-lg border border-line bg-surface p-1"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={active === tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            active === tab.key
              ? 'bg-surface-muted text-fg'
              : 'text-muted hover:text-fg'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
