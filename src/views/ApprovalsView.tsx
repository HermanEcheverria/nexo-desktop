import { useDecide, usePendingActions, useUndoableActions } from '../hooks/queries'
import { ApiError } from '../lib/api'
import { bytes } from '../lib/format'
import type { Action } from '../lib/types'

const UNDO_DAYS = 30

function until(action: Action): string {
  const end = new Date(Date.parse(action.executedAt!) + UNDO_DAYS * 86_400_000)
  return end.toLocaleDateString('es-GT', { day: 'numeric', month: 'long' })
}

export function ApprovalsView() {
  const { data: actions = [], isPending } = usePendingActions()
  // Lo que más espacio libera, primero
  const pending = [...actions].sort((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0))
  const { data: undoable = [] } = useUndoableActions()
  const decide = useDecide()
  const total = pending.reduce((s, a) => s + (a.bytes ?? 0), 0)
  const busy = (id: number) => decide.isPending && decide.variables?.id === id
  const error = decide.error instanceof ApiError ? decide.error.message : decide.error?.message

  return (
    <div className="flex flex-col gap-8 p-8 lg:p-10">
      <header>
        <p className="text-grafito font-mono text-xs tracking-[0.2em] uppercase">Tú decides</p>
        <h1 className="font-display mt-2 text-5xl">Aprobaciones</h1>
        <p className="text-tinta-suave mt-3 max-w-2xl">
          Tus agentes proponen; nada cambia sin tu permiso. Lo que apruebas va a una cuarentena y lo puedes
          deshacer durante {UNDO_DAYS} días. Después se borra de verdad.
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
          {total > 0 && <p className="text-grafito font-mono text-sm">Liberarían {bytes(total)} en total</p>}
        </div>
        {isPending ? (
          <p className="text-grafito">Cargando…</p>
        ) : pending.length === 0 ? (
          <p className="tarjeta text-grafito p-6">
            No hay nada esperando. Tus agentes te avisarán cuando propongan algo.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((a) => (
              <li key={a.id} className="tarjeta flex flex-wrap items-center gap-4 p-5">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="font-medium">
                    {a.title}
                    {a.bytes ? (
                      <span className="cifras text-cobalto ml-2 font-mono text-sm">{bytes(a.bytes)}</span>
                    ) : null}
                  </p>
                  {a.detail && <p className="text-tinta-suave text-sm">{a.detail}</p>}
                  <p className="text-grafito font-mono text-xs">
                    #{a.id} · propuesto por {a.agent}
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
            ))}
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
                  <p>{a.title}</p>
                  <p className="text-grafito font-mono text-xs">
                    #{a.id} · se borra definitivamente el {until(a)}
                  </p>
                </div>
                <button
                  type="button"
                  className="boton"
                  disabled={busy(a.id)}
                  onClick={() => decide.mutate({ id: a.id, verb: 'deshacer' })}
                >
                  {busy(a.id) ? 'Devolviendo…' : 'Deshacer'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
