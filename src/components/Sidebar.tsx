import type { ServiceStatus } from '../hooks/useService'
import { NexoLogo, type NexoState } from './NexoLogo'

export type View = 'parte' | 'conversaciones' | 'aprobaciones' | 'agentes' | 'bitacora'

const NAV: { id: View; label: string; hint: string }[] = [
  { id: 'parte', label: 'Parte del día', hint: 'Lo que encontraron tus agentes' },
  { id: 'conversaciones', label: 'Conversaciones', hint: 'Pregúntale a Nexo' },
  { id: 'aprobaciones', label: 'Aprobaciones', hint: 'Lo que tus agentes proponen' },
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
  /** Acciones esperando aprobación: se muestra junto a la sección. */
  pending: number
  /** Estado del logo vivo. */
  state: NexoState
}

export function Sidebar({ view, onChange, status, live, onWorkstation, pending, state }: Props) {
  const s = STATUS[status]
  return (
    <aside className="border-tinta bg-papel-claro flex w-64 shrink-0 flex-col border-r-[1.5px]">
      <div className="border-tinta flex flex-col gap-1 border-b-[1.5px] px-6 py-6">
        <div className="flex items-center gap-3">
          <NexoLogo state={state} size={52} />
          <p className="font-display text-4xl leading-none">Nexo</p>
        </div>
        <p className="rotulo mt-2">Tus agentes, en tu PC</p>
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
            <span className="flex w-full items-center justify-between font-medium">
              {item.label}
              {item.id === 'aprobaciones' && pending > 0 && (
                <span className="cifras bg-cobalto text-papel min-w-6 rounded-full px-2 text-center font-mono text-xs">
                  {pending}
                </span>
              )}
            </span>
            <span className="text-xs opacity-70">{item.hint}</span>
          </button>
        ))}
      </nav>

      <div className="border-tinta mt-auto flex flex-col gap-3 border-t-[1.5px] p-4">
        <button type="button" className="boton justify-center" onClick={onWorkstation}>
          Levantar estación
        </button>
        <p className="flex items-center gap-2 text-xs" role="status">
          <span className={`inline-block size-2 rounded-full ${s.dot}`} aria-hidden="true" />
          {s.label}
          {status === 'ready' && <span className="text-grafito">{live ? 'en vivo' : 'reconectando…'}</span>}
        </p>
      </div>
    </aside>
  )
}
