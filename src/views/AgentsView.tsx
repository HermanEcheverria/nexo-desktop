import { useState } from 'react'

import { RunPanel, summaryText } from '../components/RunPanel'
import type { View } from '../components/Sidebar'
import { useAgents, useProcesses, useRunAgent } from '../hooks/queries'
import { ago, dayTime, every } from '../lib/format'
import type { AgentInfo, JournalEvent, Process, ProcessState } from '../lib/types'

const STATE: Record<ProcessState, string> = {
  ready: 'en cola',
  running: 'trabajando',
  done: 'terminó bien',
  failed: 'falló',
  interrupted: 'interrumpido',
  killed: 'detenido',
}

const TRIGGER: Record<Process['trigger'], string> = {
  schedule: 'por horario',
  login: 'al iniciar sesión',
  manual: 'a pedido',
  retry: 'reintento',
  followup: 'tras una acción',
}

function duration(p: Process): string {
  if (!p.startedAt || !p.finishedAt) return ''
  return `${((Date.parse(p.finishedAt) - Date.parse(p.startedAt)) / 1000).toFixed(1)} s`
}

type Props = { events: JournalEvent[]; onNavigate: (view: View) => void }

export function AgentsView({ events, onNavigate }: Props) {
  const { data: agents = [] } = useAgents()
  const { data: processes = [] } = useProcesses()
  const run = useRunAgent()
  // Qué ejecución muestra cada tarjeta: un pid, o "esperando" desde cierto evento
  const [open, setOpen] = useState<Record<string, number | { after: number }>>({})
  const [inspect, setInspect] = useState<number | null>(null)
  const anyError = processes.some((p) => p.error)
  const titleOf = (name: string) => agents.find((a) => a.name === name)?.title ?? name

  const start = (agent: AgentInfo) => {
    setOpen((o) => ({ ...o, [agent.name]: { after: events.at(-1)?.id ?? 0 } }))
    run.mutate(agent.name, {
      onSuccess: ({ pid }) => setOpen((o) => ({ ...o, [agent.name]: pid })),
    })
  }

  /** El pid que muestra la tarjeta: el que devolvió el núcleo o el que se ve nacer en vivo. */
  const pidFor = (agent: AgentInfo): number | null => {
    const value = open[agent.name]
    if (value === undefined) return null
    if (typeof value === 'number') return value
    return (
      events.findLast((e) => e.type === 'spawn' && e.agent === agent.name && e.id > value.after)?.pid ?? null
    )
  }

  return (
    <div className="flex flex-col gap-8 p-8 lg:p-10">
      <header>
        <h1 className="font-display text-5xl">Agentes</h1>
        <p className="text-tinta-suave mt-3 max-w-2xl">
          Cada agente declara qué herramientas puede usar y el núcleo le niega cualquier otra. Las que{' '}
          <span className="text-bermellon font-medium">cambian</span> tu PC solo se usan con tu aprobación.
        </p>
      </header>

      <section className="grid items-start gap-4 xl:grid-cols-2" aria-label="Agentes instalados">
        {agents.map((agent) => {
          const pid = pidFor(agent)
          const waiting = open[agent.name] !== undefined && pid === null
          const busy = run.isPending && run.variables === agent.name
          const last = agent.lastRun
          const expanded = pid !== null || waiting
          return (
            <article
              key={agent.name}
              className={`tarjeta flex flex-col gap-3 p-6 ${expanded ? 'xl:col-span-2' : ''}`}
            >
              <header className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">{agent.title}</h2>
                  <p className="text-tinta-suave text-sm">{agent.description}</p>
                </div>
                <button type="button" className="boton shrink-0" disabled={busy} onClick={() => start(agent)}>
                  {busy ? 'Trabajando…' : 'Ejecutar ahora'}
                </button>
              </header>

              <p className="rotulo first-letter:uppercase">
                {every(agent.everyMinutes)}
                {agent.onLogin && ' y al iniciar sesión'}
              </p>

              {last && (
                <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 text-sm">
                  <span>
                    Última revisión {last.finishedAt ? ago(last.finishedAt) : ''}:{' '}
                    <span className={last.summary.warning ? 'text-bermellon font-medium' : ''}>
                      {last.state === 'done' ? summaryText(last.summary) : STATE[last.state]}
                    </span>
                  </span>
                  {!expanded && (
                    <button
                      type="button"
                      className="text-cobalto cursor-pointer text-sm underline underline-offset-4 hover:no-underline"
                      onClick={() => setOpen((o) => ({ ...o, [agent.name]: last.pid }))}
                    >
                      Ver resultados
                    </button>
                  )}
                  {expanded && !busy && (
                    <button
                      type="button"
                      className="text-grafito cursor-pointer text-sm underline underline-offset-4 hover:no-underline"
                      onClick={() =>
                        setOpen((o) => {
                          const next = { ...o }
                          delete next[agent.name]
                          return next
                        })
                      }
                    >
                      Ocultar
                    </button>
                  )}
                </div>
              )}

              <ul className="flex flex-wrap gap-2" aria-label="Permisos">
                {agent.capabilities.map((cap) => {
                  const changes = cap.risk !== 'read'
                  return (
                    <li
                      key={cap.name}
                      className={`border-[1.5px] px-2 py-0.5 font-mono text-xs ${changes ? 'border-bermellon' : 'border-tinta'}`}
                      title={changes ? 'Cambia tu PC: solo con tu aprobación' : 'Solo lee'}
                    >
                      <span className={changes ? 'text-bermellon' : 'text-cobalto'}>
                        {changes ? 'cambia' : 'lee'}
                      </span>{' '}
                      {cap.name}
                    </li>
                  )
                })}
              </ul>

              {waiting && (
                <p className="border-rejilla text-grafito border-t-[1.5px] pt-4 text-sm">
                  Lanzando al agente…
                </p>
              )}
              {pid !== null && <RunPanel pid={pid} liveEvents={events} onNavigate={onNavigate} />}
            </article>
          )
        })}
      </section>

      <section aria-labelledby="procesos" className="flex flex-col gap-2">
        <h2 id="procesos" className="font-display text-2xl">
          Procesos recientes
        </h2>
        <p className="rotulo">Elige un proceso para ver qué hizo.</p>
        {inspect !== null && (
          <div className="tarjeta flex flex-col gap-2 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl">
                {titleOf(processes.find((p) => p.pid === inspect)?.agent ?? '')} · proceso {inspect}
              </h3>
              <button
                type="button"
                className="text-grafito cursor-pointer text-sm underline underline-offset-4 hover:no-underline"
                onClick={() => setInspect(null)}
              >
                Cerrar
              </button>
            </div>
            <RunPanel pid={inspect} liveEvents={events} onNavigate={onNavigate} />
          </div>
        )}
        <div className="tarjeta overflow-x-auto">
          <table data-copiable className="cifras w-full text-left text-sm">
            <thead className="border-tinta text-grafito border-b-[1.5px]">
              <tr>
                {[
                  'Proceso',
                  'Agente',
                  'Estado',
                  'Causa',
                  'Inicio',
                  'Duración',
                  ...(anyError ? ['Error'] : []),
                ].map((h) => (
                  <th key={h} className="px-4 py-2 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processes.map((p) => (
                <tr
                  key={p.pid}
                  tabIndex={0}
                  onClick={() => setInspect(p.pid)}
                  onKeyDown={(e) => e.key === 'Enter' && setInspect(p.pid)}
                  aria-selected={inspect === p.pid}
                  className="border-rejilla hover:bg-papel aria-selected:bg-papel cursor-pointer border-b last:border-b-0"
                >
                  <td className="text-grafito px-4 py-2 font-mono">{p.pid}</td>
                  <td className="px-4 py-2 font-medium">{titleOf(p.agent)}</td>
                  <td className={`px-4 py-2 ${p.state === 'failed' ? 'text-bermellon' : ''}`}>
                    {STATE[p.state]}
                  </td>
                  <td className="px-4 py-2">{TRIGGER[p.trigger]}</td>
                  <td className="px-4 py-2 font-mono whitespace-nowrap">
                    {p.startedAt ? dayTime(p.startedAt) : '—'}
                  </td>
                  <td className="px-4 py-2 font-mono">{duration(p)}</td>
                  {anyError && <td className="text-bermellon px-4 py-2">{p.error ?? ''}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
