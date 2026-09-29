import { useRefreshAll, useReport } from '../hooks/queries'
import { ago, bytes, greeting } from '../lib/format'
import type { ReportItem } from '../lib/types'

const SECTIONS = [
  { level: 'warning', title: 'Requiere atención', mark: '▲', markClass: 'text-bermellon', label: 'Alerta' },
  { level: 'suggestion', title: 'Podrías hacer', mark: '◆', markClass: 'text-cobalto', label: 'Sugerencia' },
  { level: 'info', title: 'Estado de tu PC', mark: '·', markClass: 'text-grafito', label: 'Dato' },
] as const

function Item({
  item,
  mark,
  markClass,
  label,
}: {
  item: ReportItem
  mark: string
  markClass: string
  label: string
}) {
  const showBytes = item.bytes && !item.title.includes(bytes(item.bytes))
  return (
    <li className="border-rejilla flex gap-3 border-b-[1.5px] py-3 last:border-b-0">
      <span className={`mt-0.5 font-mono ${markClass}`} aria-label={label}>
        {mark}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-medium">
          {item.title}
          {showBytes && (
            <span className="cifras text-cobalto ml-2 font-mono text-sm">{bytes(item.bytes!)}</span>
          )}
        </p>
        {item.detail && (
          <p data-copiable className="text-tinta-suave text-sm leading-relaxed">
            {item.detail}
          </p>
        )}
      </div>
      <span className="border-tinta shrink-0 self-start border-[1.5px] px-2 py-0.5 font-mono text-[11px]">
        {item.agentTitle}
      </span>
    </li>
  )
}

export function ReportView({ name = 'Andrés', onApprovals }: { name?: string; onApprovals?: () => void }) {
  const { data: report, isPending, isError } = useReport()
  const refresh = useRefreshAll()

  if (isPending) return <p className="text-grafito p-10">Cargando el parte…</p>
  if (isError || !report) return <p className="text-bermellon p-10">No pude leer el parte del núcleo.</p>

  const warnings = report.items.filter((i) => i.level === 'warning').length
  const checked = report.agents.map((a) => a.checkedAt).filter(Boolean) as string[]
  const lastCheck = checked.sort().at(-1)
  const date = new Date().toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex flex-col gap-8 p-8 lg:p-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-grafito font-mono text-xs tracking-[0.2em] uppercase">Parte del {date}</p>
          <h1 className="font-display mt-2 text-5xl">
            {greeting()}, {name}.
          </h1>
        </div>
        <button type="button" className="boton" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
          {refresh.isPending ? 'Tus agentes están revisando…' : 'Revisar ahora'}
        </button>
      </header>

      {report.summary && (
        <section
          aria-label="Resumen de Nexo"
          className="tarjeta border-l-cobalto flex flex-col gap-2 border-l-4 p-6"
        >
          <p className="text-grafito font-mono text-xs tracking-[0.15em] uppercase">
            Resumen de Nexo ·{' '}
            {report.summary.source === 'modelo' ? 'redactado por el modelo local' : 'resumen exacto'}
          </p>
          <p data-copiable className="text-xl leading-relaxed">
            {report.summary.text}
          </p>
        </section>
      )}

      {report.pendingActions ? (
        <button
          type="button"
          onClick={onApprovals}
          className="tarjeta border-cobalto hover:bg-papel flex cursor-pointer items-center justify-between gap-4 p-5 text-left"
        >
          <span>
            <span className="font-medium">
              {report.pendingActions} {report.pendingActions === 1 ? 'acción espera' : 'acciones esperan'} tu
              aprobación
            </span>
            <span className="text-grafito block text-sm">
              Tus agentes proponen liberar espacio. Nada se mueve sin tu permiso.
            </span>
          </span>
          <span className="text-cobalto font-mono text-sm">Revisar →</span>
        </button>
      ) : null}

      <section aria-label="Resumen" className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
        <div className="tarjeta flex flex-col gap-2 p-6">
          <p className="text-grafito font-mono text-xs tracking-[0.15em] uppercase">Podrías liberar</p>
          <p className="text-6xl leading-none font-semibold">{bytes(report.reclaimableBytes)}</p>
          <p className="text-grafito text-sm">
            Sumando las sugerencias de tus agentes. Nada se borra sin tu permiso.
          </p>
        </div>
        <div className="tarjeta flex flex-col gap-2 p-6">
          <p className="text-grafito font-mono text-xs tracking-[0.15em] uppercase">Requiere atención</p>
          <p className={`text-4xl font-semibold ${warnings ? 'text-bermellon' : ''}`}>{warnings}</p>
          <p className="text-grafito text-sm">{warnings ? 'Revisa la lista de abajo' : 'Nada urgente'}</p>
        </div>
        <div className="tarjeta flex flex-col gap-2 p-6">
          <p className="text-grafito font-mono text-xs tracking-[0.15em] uppercase">Última revisión</p>
          <p className="text-4xl font-semibold">{lastCheck ? ago(lastCheck) : '—'}</p>
          <p className="text-grafito text-sm">{report.agents.length} agentes vigilando</p>
        </div>
      </section>

      {report.items.length === 0 ? (
        <p className="tarjeta text-grafito p-6">
          Tus agentes todavía no han revisado la PC. Usa «Revisar ahora».
        </p>
      ) : (
        SECTIONS.map((section) => {
          const items = report.items.filter((i) => i.level === section.level)
          if (!items.length) return null
          return (
            <section
              key={section.level}
              aria-labelledby={`seccion-${section.level}`}
              className="flex flex-col gap-2"
            >
              <h2 id={`seccion-${section.level}`} className="font-display text-2xl">
                {section.title}
              </h2>
              <ul className="tarjeta px-5">
                {items.map((item, i) => (
                  <Item
                    key={`${item.agent}-${i}`}
                    item={item}
                    mark={section.mark}
                    markClass={section.markClass}
                    label={section.label}
                  />
                ))}
              </ul>
            </section>
          )
        })
      )}
    </div>
  )
}
