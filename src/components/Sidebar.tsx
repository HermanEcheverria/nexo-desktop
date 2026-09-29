import type { ServiceStatus } from '../hooks/useService'

export type View = 'parte' | 'agentes' | 'bitacora'

const NAV: { id: View; label: string; hint: string }[] = [
  { id: 'parte', label: 'Parte del día', hint: 'Lo que encontraron tus agentes' },
  { id: 'agentes', label: 'Agentes', hint: 'Quién trabaja y con qué permisos' },
  { id: 'bitacora', label: 'Bitácora', hint: 'Todo lo que pasa, en vivo' },
]

const STATUS: Record<ServiceStatus, { label: string; dot: string }> = {
  checking: { label: 'Buscando el núcleo…', dot: 'bg-grafito' },
  starting: { label: 'Encendiendo en WSL…', dot: 'bg-grafito animate-pulse' },
  ready: { label: 'Núcleo activo', dot: 'bg-cobalto' },
  unreachable: { label: 'Núcleo sin respuesta', dot: 'bg-bermellon' },
}

type Props = {
  view: View
  onChange: (view: View) => void
  status: ServiceStatus
  live: boolean
  onWorkstation: () => void
}

export function Sidebar({ view, onChange, status, live, onWorkstation }: Props) {
  const s = STATUS[status]
  return (
    <aside className="border-tinta bg-papel-claro flex w-64 shrink-0 flex-col border-r-[1.5px]">
      <div className="border-tinta border-b-[1.5px] px-6 py-6">
        <p className="font-display text-4xl leading-none">Nexo</p>
        <p className="text-grafito mt-2 font-mono text-[11px] tracking-[0.15em] uppercase">
          Sistema operativo de agentes
        </p>
      </div>

      <nav aria-label="Secciones" className="flex flex-col gap-1 p-3">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-current={view === item.id ? 'page' : undefined}
            className="hover:border-tinta aria-[current=page]:border-tinta aria-[current=page]:bg-tinta aria-[current=page]:text-papel flex cursor-pointer flex-col items-start border-[1.5px] border-transparent px-3 py-2.5 text-left"
          >
            <span className="font-medium">{item.label}</span>
            <span className="text-xs opacity-70">{item.hint}</span>
          </button>
        ))}
      </nav>

      <div className="border-tinta mt-auto flex flex-col gap-3 border-t-[1.5px] p-4">
        <button type="button" className="boton justify-center" onClick={onWorkstation}>
          Levantar estación
        </button>
        <p className="flex items-center gap-2 font-mono text-xs" role="status">
          <span className={`inline-block size-2 rounded-full ${s.dot}`} aria-hidden="true" />
          {s.label}
          {status === 'ready' && <span className="text-grafito">· {live ? 'en vivo' : 'reconectando'}</span>}
        </p>
      </div>
    </aside>
  )
}
