import { ArrowDown, Cpu, Monitor, Server } from 'lucide-react'
import type { ReactNode } from 'react'

function Layer({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-line bg-surface">
      <header className="flex items-center gap-3 border-b border-line-soft px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-fg">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-line bg-surface-muted px-2 py-1 font-mono text-xs text-muted">
      {label}
    </span>
  )
}

function Flow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1 text-xs text-subtle">
      <ArrowDown size={14} strokeWidth={1.75} />
      {label}
    </div>
  )
}

export default function ArchitecturePanel() {
  return (
    <div className="space-y-1">
      <Layer
        icon={<Monitor size={16} strokeWidth={1.75} />}
        title="Browser — React + TypeScript + Tailwind"
        subtitle="dashboard only renders; it never schedules"
      >
        <div className="flex flex-wrap gap-2">
          {[
            'App (tabs)',
            'SummaryCards',
            'Gantt',
            'ReplayPanel',
            'CvChart',
            'ComparisonCharts',
            'StackedGantt',
            'BenchmarkPanel',
            'DecisionLog',
          ].map((label) => (
            <Chip key={label} label={label} />
          ))}
        </div>
      </Layer>

      <Flow label="HTTP · JSON (/api/run, /api/cooldown-sweep, /api/benchmark/*)" />

      <Layer
        icon={<Server size={16} strokeWidth={1.75} />}
        title="API — FastAPI"
        subtitle="thin layer: validate, call the engine, serialise"
      >
        <div className="flex flex-wrap gap-2">
          {[
            'schemas.py (pydantic)',
            'app.py (routes)',
            'serializers.py',
          ].map((label) => (
            <Chip key={label} label={label} />
          ))}
        </div>
      </Layer>

      <Flow label="Python calls" />

      <Layer
        icon={<Cpu size={16} strokeWidth={1.75} />}
        title="Engine — pure Python"
        subtitle="all scheduling logic lives here (no web dependencies)"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ModuleBox
            title="AKT-Arbiter"
            accent
            items={['3 rules (urgent / skew / balanced)', 'cooldown · aging · priority cap']}
          />
          <ModuleBox
            title="Algorithms"
            items={['FCFS', 'SJF', 'SRTF', 'Round Robin', 'Priority']}
          />
          <ModuleBox
            title="Simulator"
            items={['tick loop (1 ms)', 'switch penalty', 'per-tick frames']}
          />
          <ModuleBox
            title="Workload stats"
            items={['mean · std · CV', 'max wait · max priority']}
          />
          <ModuleBox
            title="Metrics"
            items={['waiting · turnaround · response', 'CPU% · context/algo switches']}
          />
          <ModuleBox
            title="Experiments"
            items={['cooldown sweep', 'quantum sweep', 'matrix + random benchmark']}
          />
          <ModuleBox
            title="Config & Presets"
            items={['SimConfig thresholds', 'preset workloads']}
          />
          <ModuleBox
            title="Models"
            items={['Process · Frame', 'RunResult · Metrics']}
          />
        </div>
      </Layer>

      <p className="pt-2 text-xs leading-relaxed text-subtle">
        The arbiter never schedules — it only decides which algorithm schedules next.
        Each algorithm is an independent module behind one interface, so a rule or
        threshold can change without touching the algorithms.
      </p>
    </div>
  )
}

function ModuleBox({
  title,
  items,
  accent,
}: {
  title: string
  items: string[]
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        accent ? 'border-accent/40 bg-accent-soft' : 'border-line bg-surface-muted'
      }`}
    >
      <div className="text-sm font-semibold">{title}</div>
      <ul className="mt-1 space-y-0.5">
        {items.map((item) => (
          <li key={item} className="font-mono text-xs text-muted">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
