import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { api } from '../lib/api'
import type { Answer } from '../lib/types'
import type { View } from './Sidebar'

const EXAMPLES = [
  '¿Qué ocupa tanto espacio?',
  'Revisa de nuevo mis proyectos',
  '¿Hay actualizaciones pendientes?',
]

/**
 * Barra para hablarle a Nexo en español (Ctrl+K). La respuesta la da el modelo local:
 * puede explicar, pedirle a un agente que revise o llevarte a Aprobaciones, nunca
 * cambiar la PC por su cuenta.
 */
export function CommandBar({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [text, setText] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const client = useQueryClient()
  const ask = useMutation({
    mutationFn: api.ask,
    onSuccess: (answer: Answer) => {
      if (answer.pid) void client.invalidateQueries()
    },
  })

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        input.current?.focus()
      }
      if (event.key === 'Escape') ask.reset()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ask])

  const submit = (question: string) => {
    const q = question.trim()
    if (q.length < 2 || ask.isPending) return
    ask.mutate(q)
  }

  const answer = ask.data
  return (
    <div className="border-tinta bg-papel/95 sticky top-0 z-20 border-b-[1.5px] px-8 py-4 backdrop-blur lg:px-10">
      <form
        className="flex items-center gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          submit(text)
        }}
      >
        <label htmlFor="pregunta" className="sr-only">
          Pregúntale a Nexo
        </label>
        <input
          id="pregunta"
          ref={input}
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={500}
          placeholder="Pregúntale a Nexo…  (Ctrl+K)"
          className="tarjeta placeholder:text-grafito focus-visible:border-cobalto min-w-0 flex-1 px-4 py-2.5 font-sans outline-none"
        />
        <button type="submit" className="boton" disabled={ask.isPending || text.trim().length < 2}>
          {ask.isPending ? 'Pensando…' : 'Preguntar'}
        </button>
      </form>

      {!answer && !ask.isPending && !ask.isError && (
        <p className="text-grafito mt-2 flex flex-wrap gap-2 font-mono text-xs">
          Prueba:
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              className="decoration-rejilla hover:text-cobalto cursor-pointer underline underline-offset-4"
              onClick={() => {
                setText(example)
                submit(example)
              }}
            >
              {example}
            </button>
          ))}
        </p>
      )}

      {ask.isError && (
        <p role="alert" className="text-bermellon mt-3 text-sm">
          {ask.error.message.includes('502')
            ? 'El modelo local no respondió. Revisa que Ollama esté abierto.'
            : 'No pude preguntarle a Nexo.'}
        </p>
      )}

      {answer && (
        <div
          role="status"
          className="tarjeta mt-3 flex flex-col gap-3 p-4 shadow-[4px_4px_0_var(--color-tinta)]"
        >
          <p data-copiable className="leading-relaxed whitespace-pre-line">
            {answer.respuesta}
          </p>
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            {answer.intencion === 'ver_aprobaciones' && (
              <button type="button" className="boton" onClick={() => onNavigate('aprobaciones')}>
                Ir a Aprobaciones →
              </button>
            )}
            {answer.pid && (
              <button type="button" className="boton" onClick={() => onNavigate('bitacora')}>
                Ver al {answer.agente} trabajando →
              </button>
            )}
            <span className="text-grafito">Respondió el modelo local · nada salió de tu PC</span>
            <button
              type="button"
              className="text-grafito hover:text-tinta ml-auto cursor-pointer"
              onClick={() => {
                ask.reset()
                setText('')
              }}
            >
              Cerrar (Esc)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
