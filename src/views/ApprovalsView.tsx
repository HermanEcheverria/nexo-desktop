import { useAgents, useDecide, usePendingActions, useUndoableActions } from '../hooks/queries'
import { ApiError } from '../lib/api'
import { bytes } from '../lib/format'
import type { Action } from '../lib/types'

const UNDO_DAYS = 30

function until(action: Action): string {
  const end = new Date(Date.parse(action.executedAt!) + UNDO_DAYS * 86_400_000)
  return end.toLocaleDateString('es-GT', { day: 'numeric', month: 'long' })
}

/**
 * "Mover a cuarentena «archivo.zip»" → qué (archivo.zip) y cómo (Mover a cuarentena),
 * para que el nombre del archivo sea lo primero que se lee.
 */
export function splitTitle(title: string): { what: string; verb: string | null } {
  const match = /^(.+?)\s«(.+)»$/.exec(title)
  return match ? { what: match[2]!, verb: match[1]! } : { what: title, verb: null }
}

export function ApprovalsView() {
  const { data: actions = [], isPending } = usePendingActions()
  // Lo que más espacio libera, primero
  const pending = [...actions].sort((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0))
  const { data: undoable = [] } = useUndoableActions()
  const decide = useDecide()
  const { data: agents = [] } = useAgents()
  const agentTitle = (name: string) => agents.find((a) => a.name === name)?.title ?? name
  const total = pending.reduce((s, a) => s + (a.bytes ?? 0), 0)
  const busy = (id: number) => decide.isPending && decide.variables?.id === id
  const error = decide.error instanceof ApiError ? decide.error.message : decide.error?.message

  return (
    <div className="flex flex-col gap-8 p-8 lg:p-10">
      <header>
        <h1 className="font-display text-5xl">Aprobaciones</h1>
        <p className="text-tinta-suave mt-3 max-w-2xl">
          Tus agentes proponen y tú decides. Lo que apruebas va a una cuarentena: puedes devolverlo durante{' '}
          {UNDO_DAYS} días y después se borra de verdad.
        </p>
      </header>

      {error && (
        <p role="alert" className="tarjeta border-bermellon text-bermellon p-4">
          {error}
        </p>
      )}

      <section aria-labelledby="pendientes" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="pendientes" className="font-display text-2xl">
            Esperan tu decisión {pending.length > 0 && `(${pending.length})`}
          </h2>
          {total > 0 && (
            <p className="rotulo">
              Liberarían <span className="cifras text-tinta font-medium">{bytes(total)}</span> en total
            </p>
          )}
        </div>
        {isPending ? (
          <p className="text-grafito">Cargando…</p>
        ) : pending.length === 0 ? (
          <p className="tarjeta text-grafito p-6">
            No hay nada esperando. Tus agentes te avisarán cuando propongan algo.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((a) => {
              const { what, verb } = splitTitle(a.title)
              return (
                <li key={a.id} className="tarjeta flex flex-wrap items-center gap-4 p-5">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="flex flex-wrap items-baseline gap-x-3 font-medium">
                      <span data-copiable className="break-all">
                        {what}
                      </span>
                      {a.bytes ? (
                        <span className="cifras text-cobalto font-mono text-sm">{bytes(a.bytes)}</span>
                      ) : null}
                    </p>
                    {a.detail && <p className="text-tinta-suave text-sm">{a.detail}</p>}
                    <p className="rotulo">
                      {verb ? `${verb}. ` : ''}Lo propuso {agentTitle(a.agent)}.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="boton"
                      disabled={busy(a.id)}
                      onClick={() => decide.mutate({ id: a.id, verb: 'rechazar' })}
                    >
                      Rechazar
                    </button>
                    <button
                      type="button"
                      className="boton bg-tinta text-papel"
                      disabled={busy(a.id)}
                      onClick={() => decide.mutate({ id: a.id, verb: 'aprobar' })}
                    >
                      {busy(a.id) ? 'Moviendo…' : 'Aprobar'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {undoable.length > 0 && (
        <section aria-labelledby="deshacer" className="flex flex-col gap-3">
          <h2 id="deshacer" className="font-display text-2xl">
            En cuarentena
          </h2>
          <ul className="tarjeta px-5">
            {undoable.map((a) => (
              <li
                key={a.id}
                className="border-rejilla flex flex-wrap items-center gap-4 border-b-[1.5px] py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p data-copiable className="break-all">
                    {splitTitle(a.title).what}
                  </p>
                  <p className="rotulo">Se borra definitivamente el {until(a)}.</p>
                </div>
                <button
                  type="button"
                  className="boton"
                  disabled={busy(a.id)}
                  onClick={() => decide.mutate({ id: a.id, verb: 'deshacer' })}
                >
                  {busy(a.id) ? 'Devolviendo…' : 'Devolver'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
