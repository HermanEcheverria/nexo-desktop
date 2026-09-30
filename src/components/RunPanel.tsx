import { useQuery } from '@tanstack/react-query'

import { keys } from '../hooks/queries'
import { api } from '../lib/api'
import { ago, bytes } from '../lib/format'
import type { JournalEvent, Level, RunChange, RunSummary } from '../lib/types'
import { NexoLogo } from './NexoLogo'
import type { View } from './Sidebar'

const MARK: Record<Level, { mark: string; className: string; label: string }> = {
  warning: { mark: '▲', className: 'text-bermellon', label: 'Alerta' },
  suggestion: { mark: '◆', className: 'text-cobalto', label: 'Sugerencia' },
  info: { mark: '·', className: 'text-grafito', label: 'Dato' },
}

export function summaryText(s: RunSummary): string {
  const parts = [
    s.warning ? `${s.warning} ${s.warning === 1 ? 'alerta' : 'alertas'}` : null,
    s.suggestion ? `${s.suggestion} ${s.suggestion === 1 ? 'sugerencia' : 'sugerencias'}` : null,
    s.info ? `${s.info} ${s.info === 1 ? 'dato' : 'datos'}` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'sin hallazgos'
}

/** Un paso de la bitácora, en palabras. */
function stepText(e: JournalEvent): { icon: string; text: string } | null {
  const d = e.data
  switch (e.type) {
    case 'start':
      return { icon: '▸', text: 'Empezó a revisar' }
    case 'tool_call':
      return { icon: '✓', text: `${d.tool} · ${d.ms} ms` }
    case 'tool_denied':
      return { icon: '✕', text: `${d.tool}: permiso negado` }
    case 'tool_error':
      return { icon: '✕', text: `${d.tool} falló` }
    case 'finding':
      return { icon: '•', text: String(d.title) }
    case 'proposal':
      return { icon: '◆', text: `Propuso: ${d.title}` }
    case 'exit':
      return {
        icon: d.state === 'done' ? '■' : '✕',
        text: d.state === 'done' ? 'Terminó' : `Terminó mal: ${d.error ?? d.state}`,
      }
    default:
      return null
  }
}

function Change({ change }: { change: RunChange }) {
  const m = MARK[change.level]
  if (change.kind === 'cambio') {
    return (
      <li className="flex gap-2">
        <span className="text-grafito w-20 shrink-0 font-mono text-xs uppercase">cambió</span>
        <span>
          <span className="text-grafito line-through">{change.before}</span> → {change.after}
        </span>
      </li>
    )
  }
  return (
    <li className="flex gap-2">
      <span
        className={`w-20 shrink-0 font-mono text-xs uppercase ${change.kind === 'nuevo' ? m.className : 'text-grafito'}`}
      >
        {change.kind === 'nuevo' ? `${m.mark} nuevo` : '✓ resuelto'}
      </span>
      <span className={change.kind === 'resuelto' ? 'text-grafito' : ''}>{change.title}</span>
    </li>
  )
}

/**
 * Lo que hizo un agente en una ejecución. Mientras trabaja muestra los pasos en vivo
 * (desde la bitácora); al terminar, los hallazgos, qué cambió y lo que propuso.
 */
export function RunPanel({
  pid,
  liveEvents,
  onNavigate,
}: {
  pid: number
  liveEvents: JournalEvent[]
  onNavigate: (view: View) => void
}) {
  const live = liveEvents.filter((e) => e.pid === pid)
  const finished = live.some((e) => e.type === 'exit')
  const details = useQuery({ queryKey: keys.run(pid), queryFn: () => api.run(pid) })
  const running =
    !finished && details.data?.process.state !== 'done' && details.data?.process.state !== 'failed'

  if (running || !details.data) {
    const steps = (live.length ? live : (details.data?.steps ?? [])).map(stepText).filter(Boolean)
    return (
      <div className="border-rejilla flex flex-col gap-3 border-t-[1.5px] pt-4" aria-live="polite">
        <p className="flex items-center gap-3 font-mono text-sm">
          <NexoLogo state="trabajando" size={36} />
          Revisando tu PC…
        </p>
        <ol className="flex flex-col gap-1 font-mono text-xs">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-cobalto w-4">{s!.icon}</span>
              {s!.text}
            </li>
          ))}
        </ol>
      </div>
    )
  }

  const d = details.data
  const order: Level[] = ['warning', 'suggestion', 'info']
  const findings = [...d.findings].sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level))
  const important = d.changes?.filter((c) => c.kind !== 'cambio' || c.level !== 'info') ?? []
  const duration =
    d.process.startedAt && d.process.finishedAt
      ? `${((Date.parse(d.process.finishedAt) - Date.parse(d.process.startedAt)) / 1000).toFixed(1)} s`
      : null

  return (
    <div className="border-rejilla flex flex-col gap-4 border-t-[1.5px] pt-4">
      <p className="text-grafito font-mono text-xs">
        Proceso #{d.process.pid} · {d.process.finishedAt ? ago(d.process.finishedAt) : ''}
        {duration && ` · tardó ${duration}`} · {summaryText(d.summary)}
      </p>

      {d.process.state === 'failed' && <p className="text-bermellon">No terminó bien: {d.process.error}</p>}

      {d.changes && (
        <section className="flex flex-col gap-1.5">
          <h3 className="text-grafito font-mono text-xs tracking-[0.15em] uppercase">
            Qué cambió desde la revisión anterior
          </h3>
          {important.length === 0 ? (
            <p className="text-grafito text-sm">Nada importante: todo sigue igual.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {important.map((c, i) => (
                <Change key={i} change={c} />
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="flex flex-col gap-1.5">
        <h3 className="text-grafito font-mono text-xs tracking-[0.15em] uppercase">Lo que encontró</h3>
        <ul className="flex flex-col gap-2">
          {findings.map((f) => (
            <li key={f.id} className="flex gap-2 text-sm">
              <span className={`font-mono ${MARK[f.level].className}`} aria-label={MARK[f.level].label}>
                {MARK[f.level].mark}
              </span>
              <span>
                <span className="font-medium">{f.title}</span>
                {f.bytes && !f.title.includes(bytes(f.bytes)) ? (
                  <span className="text-cobalto ml-2 font-mono text-xs">{bytes(f.bytes)}</span>
                ) : null}
                {f.detail && <span className="text-tinta-suave block">{f.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {d.proposals.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm">
            Propuso {d.proposals.length} {d.proposals.length === 1 ? 'acción' : 'acciones'}; ninguna se
            ejecuta sin tu permiso.
          </p>
          <button type="button" className="boton py-1 text-xs" onClick={() => onNavigate('aprobaciones')}>
            Revisar propuestas →
          </button>
        </div>
      )}
    </div>
  )
}
