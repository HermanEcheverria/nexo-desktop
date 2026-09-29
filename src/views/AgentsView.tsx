import { useAgents, useProcesses, useRunAgent } from '../hooks/queries'
import { ago, every, timeOf } from '../lib/format'
import type { Process, ProcessState } from '../lib/types'

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
}

function duration(p: Process): string {
  if (!p.startedAt || !p.finishedAt) return ''
  return `${((Date.parse(p.finishedAt) - Date.parse(p.startedAt)) / 1000).toFixed(1)} s`
}

export function AgentsView() {
  const { data: agents = [] } = useAgents()
  const { data: processes = [] } = useProcesses()
  const run = useRunAgent()

  return (
    <div className="flex flex-col gap-8 p-8 lg:p-10">
      <header>
        <p className="text-grafito font-mono text-xs tracking-[0.2em] uppercase">Procesos y permisos</p>
        <h1 className="font-display mt-2 text-5xl">Agentes</h1>
        <p className="text-tinta-suave mt-3 max-w-2xl">
          Cada agente declara qué herramientas puede usar. El núcleo le niega cualquier otra, y por ahora
          ninguna puede cambiar tu PC: solo mirar.
        </p>
      </header>

      <section className="grid gap-4 xl:grid-cols-2" aria-label="Agentes instalados">
        {agents.map((agent) => {
          const last = processes.find((p) => p.agent === agent.name)
          const busy =
            last?.state === 'running' ||
            last?.state === 'ready' ||
            (run.isPending && run.variables === agent.name)
          return (
            <article key={agent.name} className="tarjeta flex flex-col gap-3 p-6">
              <header className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">{agent.title}</h2>
                  <p className="text-tinta-suave text-sm">{agent.description}</p>
                </div>
                <button
                  type="button"
                  className="boton shrink-0"
                  disabled={busy}
                  onClick={() => run.mutate(agent.name)}
                >
                  {busy ? 'Trabajando…' : 'Ejecutar ahora'}
                </button>
              </header>
              <p className="text-grafito font-mono text-xs">
                {every(agent.everyMinutes)}
                {agent.onLogin && ' y al iniciar sesión'}
                {last && ` · último: ${STATE[last.state]} ${last.finishedAt ? ago(last.finishedAt) : ''}`}
              </p>
              <ul className="flex flex-wrap gap-2" aria-label="Permisos">
                {agent.capabilities.map((cap) => (
                  <li key={cap} className="border-tinta border-[1.5px] px-2 py-0.5 font-mono text-xs">
                    <span className="text-cobalto">lee</span> {cap}
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </section>

      <section aria-labelledby="procesos" className="flex flex-col gap-2">
        <h2 id="procesos" className="font-display text-2xl">
          Procesos recientes
        </h2>
        <div className="tarjeta overflow-x-auto">
          <table data-copiable className="cifras w-full text-left font-mono text-sm">
            <thead className="border-tinta text-grafito border-b-[1.5px] text-xs">
              <tr>
                {['PID', 'Agente', 'Estado', 'Causa', 'Inicio', 'Duración', 'Error'].map((h) => (
                  <th key={h} className="px-4 py-2 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processes.map((p) => (
                <tr key={p.pid} className="border-rejilla border-b last:border-b-0">
                  <td className="px-4 py-2">{p.pid}</td>
                  <td className="px-4 py-2">{p.agent}</td>
                  <td className={`px-4 py-2 ${p.state === 'failed' ? 'text-bermellon' : ''}`}>
                    {STATE[p.state]}
                  </td>
                  <td className="px-4 py-2">{TRIGGER[p.trigger]}</td>
                  <td className="px-4 py-2">{p.startedAt ? timeOf(p.startedAt) : '—'}</td>
                  <td className="px-4 py-2">{duration(p)}</td>
                  <td className="text-bermellon px-4 py-2">{p.error ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
