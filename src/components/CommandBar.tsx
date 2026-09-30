import { useEffect, useRef, useState } from 'react'

const EXAMPLES = [
  '¿Qué ocupa tanto espacio?',
  'Revisa de nuevo mis proyectos',
  '¿Hay actualizaciones pendientes?',
]

/**
 * Barra rápida (Ctrl+K): lo que escribas se envía a la conversación abierta en
 * Conversaciones, así todo queda en el historial.
 */
export function CommandBar({ onAsk }: { onAsk: (question: string) => void }) {
  const [text, setText] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const submit = (question: string) => {
    const q = question.trim()
    if (q.length < 2) return
    setText('')
    onAsk(q)
  }

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
        <button type="submit" className="boton" disabled={text.trim().length < 2}>
          Preguntar
        </button>
      </form>
      <p className="text-grafito mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        Prueba con
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            className="hover:text-cobalto hover:decoration-cobalto cursor-pointer underline decoration-[color-mix(in_srgb,currentColor_35%,transparent)] underline-offset-4"
            onClick={() => submit(example)}
          >
            {example}
          </button>
        ))}
      </p>
    </div>
  )
}
