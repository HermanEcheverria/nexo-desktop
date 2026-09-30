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

function Figure({
  label,
  value,
  tone,
  children,
}: {
  label: string
  value: string
  tone?: 'alerta' | 'accion'
  children: React.ReactNode
}) {
  const color = tone === 'alerta' ? 'text-bermellon' : tone === 'accion' ? 'text-cobalto' : ''
  return (
    <div className="flex h-full flex-col gap-1 p-6">
      <p className="rotulo">{label}</p>
      <p className={`font-display cifras text-5xl leading-tight whitespace-nowrap ${color}`}>{value}</p>
      <p className="text-grafito text-sm">{children}</p>
    </div>
  )
}

export function ReportView({ onApprovals }: { onApprovals?: () => void }) {
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
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="rotulo first-letter:uppercase">{date}</p>
            <h1 className="font-display mt-1 text-5xl">
              {greeting()}
              {report.userName ? `, ${report.userName}` : ''}.
            </h1>
          </div>
          <button
            type="button"
            className="boton"
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
            aria-busy={refresh.isPending}
          >
            {refresh.isPending ? 'Tus agentes están revisando…' : 'Revisar ahora'}
          </button>
        </div>
        {report.summary && (
          <div className="border-cobalto flex max-w-3xl flex-col gap-1 border-l-4 pl-5">
            <p data-copiable className="text-xl leading-relaxed">
              {report.summary.text}
            </p>
            <p className="rotulo">
              {report.summary.source === 'modelo' ? 'Lo redactó el modelo local' : 'Resumen exacto'},{' '}
              {ago(report.summary.at)}.
            </p>
          </div>
        )}
      </header>

      <section
        aria-label="Cifras del día"
        className="tarjeta bg-rejilla [&>*]:bg-papel-claro grid gap-[1.5px] sm:grid-cols-2 xl:grid-cols-4"
      >
        <Figure label="Podrías liberar" value={bytes(report.reclaimableBytes)}>
          Sumando las sugerencias. Nada se borra sin tu permiso.
        </Figure>
        <Figure label="Requiere atención" value={String(warnings)} tone={warnings ? 'alerta' : undefined}>
          {warnings ? 'Está primero en la lista' : 'Nada urgente'}
        </Figure>
        {report.pendingActions ? (
          <button
            type="button"
            onClick={onApprovals}
            className="group hover:!bg-papel cursor-pointer text-left"
          >
            <Figure label="Por aprobar" value={String(report.pendingActions)} tone="accion">
              <span className="text-cobalto underline underline-offset-4 group-hover:no-underline">
                Ver propuestas
              </span>
            </Figure>
          </button>
        ) : (
          <Figure label="Por aprobar" value="0">
            Tus agentes no proponen nada
          </Figure>
        )}
        <Figure label="Revisaron hace" value={lastCheck ? ago(lastCheck).replace('hace ', '') : '—'}>
          {report.agents.length} agentes vigilando
        </Figure>
      </section>

      {report.items.length === 0 ? (
        <p className="tarjeta text-grafito p-6">
          Tus agentes todavía no han revisado la PC. Pulsa «Revisar ahora» para empezar.
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
