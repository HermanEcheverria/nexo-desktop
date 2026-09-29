import type { JournalEvent } from '../lib/types'

const TRIGGERS: Record<string, string> = {
  schedule: 'por horario',
  login: 'al iniciar sesión',
  manual: 'a pedido',
  retry: 'reintento',
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
      return String(d.title)
    case 'exit':
      return d.state === 'done' ? 'bien' : `${d.state}: ${d.error ?? ''}`
    case 'spawn':
      return `${TRIGGERS[String(d.trigger)] ?? d.trigger} · intento ${d.attempt}`
    default:
      return d.message ? String(d.message) : ''
  }
}

export function JournalView({ events, live }: { events: JournalEvent[]; live: boolean }) {
  const rows = [...events].reverse()
  return (
    <div className="flex flex-col gap-6 p-8 lg:p-10">
      <header>
        <p className="text-grafito font-mono text-xs tracking-[0.2em] uppercase">
          {live ? '● En vivo' : 'Reconectando…'}
        </p>
        <h1 className="font-display mt-2 text-5xl">Bitácora</h1>
        <p className="text-tinta-suave mt-3 max-w-2xl">
          Registro de solo escritura: cada proceso, cada herramienta usada y cada hallazgo, en el orden en que
          pasó.
        </p>
      </header>
      <ol data-copiable className="tarjeta cifras flex flex-col font-mono text-sm" aria-live="polite">
        {rows.length === 0 && <li className="text-grafito p-4">Sin eventos todavía.</li>}
        {rows.map((e) => (
          <li
            key={e.id}
            title={JSON.stringify(e.data)}
            className="border-rejilla grid grid-cols-[6rem_9rem_10rem_1fr] gap-3 border-b px-4 py-2 last:border-b-0"
          >
            <span className="text-grafito">
              {new Date(e.at).toLocaleTimeString('es-GT', { hour12: false })}
            </span>
            <span>{e.agent ? `${e.agent}#${e.pid}` : 'nexo'}</span>
            <span
              className={
                e.type === 'tool_denied' || (e.type === 'exit' && e.data.state !== 'done')
                  ? 'text-bermellon'
                  : 'text-cobalto'
              }
            >
              {LABELS[e.type] ?? e.type}
            </span>
            <span className="text-tinta-suave truncate">{describe(e)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
