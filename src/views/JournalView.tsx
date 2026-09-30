import type { JournalEvent } from '../lib/types'

const TRIGGERS: Record<string, string> = {
  schedule: 'por horario',
  login: 'al iniciar sesión',
  manual: 'a pedido',
  retry: 'reintento',
  followup: 'tras una acción',
}

const LABELS: Record<string, string> = {
  spawn: 'lanzado',
  start: 'empezó',
  tool_call: 'usó herramienta',
  tool_denied: 'permiso negado',
  tool_error: 'error en herramienta',
  finding: 'hallazgo',
  exit: 'terminó',
  interrupted: 'interrumpido',
  message: 'nota',
  login: 'inicio de sesión',
  proposal: 'propuso',
  approved: 'aprobaste',
  rejected: 'rechazaste',
  action_done: 'acción hecha',
  action_failed: 'acción falló',
  undone: 'deshecho',
  purged: 'borrado definitivo',
}

/** Resumen legible de cada evento; el detalle completo se ve al pasar el mouse. */
export function describe(e: JournalEvent): string {
  const d = e.data
  switch (e.type) {
    case 'tool_call':
      return `${d.tool} · ${d.ms} ms`
    case 'tool_denied':
      return `${d.tool} (${d.reason === 'needs-approval' ? 'necesita tu aprobación' : 'sin permiso'})`
    case 'finding':
    case 'proposal':
      return String(d.title)
    case 'approved':
    case 'rejected':
    case 'action_done':
    case 'undone':
    case 'purged':
      return `acción #${d.action}`
    case 'action_failed':
      return `acción #${d.action}: ${d.error}`
    case 'exit':
      return d.state === 'done' ? 'bien' : `${d.state}: ${d.error ?? ''}`
    case 'spawn':
      return `${TRIGGERS[String(d.trigger)] ?? d.trigger} · intento ${d.attempt}`
    default:
      return d.message ? String(d.message) : ''
  }
}

/** El color dice qué importa: alertas y fallos en bermellón, propuestas en cobalto, rutina en grafito. */
function tone(e: JournalEvent): string {
  if (
    e.type === 'tool_denied' ||
    e.type === 'tool_error' ||
    e.type === 'action_failed' ||
    (e.type === 'exit' && e.data.state !== 'done') ||
    (e.type === 'finding' && e.data.level === 'warning')
  )
    return 'text-bermellon'
  if (e.type === 'proposal' || e.type === 'approved' || e.type === 'action_done') return 'text-cobalto'
  if (e.type === 'finding') return 'text-tinta'
  return 'text-grafito'
}

function dayOf(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Hoy'
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer'
  const text = date.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function JournalView({ events, live }: { events: JournalEvent[]; live: boolean }) {
  const rows = [...events].reverse()
  return (
    <div className="flex flex-col gap-6 p-8 lg:p-10">
      <header>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="font-display text-5xl">Bitácora</h1>
          <p className="rotulo flex items-center gap-2" role="status">
            <span
              className={`inline-block size-2 rounded-full ${live ? 'bg-cobalto' : 'bg-grafito animate-pulse'}`}
              aria-hidden="true"
            />
            {live ? 'En vivo' : 'Reconectando…'}
          </p>
        </div>
        <p className="text-tinta-suave mt-3 max-w-2xl">
          Todo lo que hacen tus agentes, en el orden en que pasó. Nada se borra ni se edita aquí.
        </p>
      </header>
      <ol data-copiable className="tarjeta cifras flex flex-col text-sm" aria-live="polite">
        {rows.length === 0 && <li className="text-grafito p-4">Todavía no hay eventos.</li>}
        {rows.map((e, i) => {
          const day = dayOf(e.at)
          const newDay = i === 0 || dayOf(rows[i - 1]!.at) !== day
          return (
            <li key={e.id} className="flex flex-col [&:last-child>div]:border-b-0">
              {newDay && (
                <p
                  className={`border-tinta bg-papel font-display border-b-[1.5px] px-4 py-2 text-base ${i > 0 ? 'border-t-[1.5px]' : ''}`}
                >
                  {day}
                </p>
              )}
              <div
                title={JSON.stringify(e.data)}
                className="border-rejilla grid grid-cols-[5rem_8rem_9rem_1fr] gap-3 border-b px-4 py-1.5"
              >
                <span className="text-grafito font-mono">
                  {new Date(e.at).toLocaleTimeString('es-GT', { hour12: false })}
                </span>
                <span className="font-mono">{e.agent ? `${e.agent}#${e.pid}` : 'nexo'}</span>
                <span className={tone(e)}>{LABELS[e.type] ?? e.type}</span>
                <span className={`truncate ${e.type === 'finding' ? '' : 'text-tinta-suave'}`}>
                  {describe(e)}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
