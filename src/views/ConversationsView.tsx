import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { NexoLogo } from '../components/NexoLogo'
import type { View } from '../components/Sidebar'
import { keys } from '../hooks/queries'
import { api } from '../lib/api'
import { ago } from '../lib/format'
import type { ChatMessage } from '../lib/types'

type Props = {
  /** Pregunta que llegó desde la barra (Ctrl+K): se envía al abrir la vista. */
  incoming: string | null
  onIncomingHandled: () => void
  onNavigate: (view: View) => void
  onThinking: (thinking: boolean) => void
}

/**
 * Conversaciones con Nexo, como un chat con historial. Todo se guarda en tu PC.
 * Nexo recuerda lo que hablaron (el resumen de lo viejo y los últimos mensajes).
 */
export function ConversationsView({ incoming, onIncomingHandled, onNavigate, onThinking }: Props) {
  const client = useQueryClient()
  // null = la más reciente · 'nueva' = conversación en blanco · número = la que elegiste
  const [selection, setSelection] = useState<number | 'nueva' | null>(null)
  const [draft, setDraft] = useState('')
  const [optimistic, setOptimistic] = useState<string | null>(null)
  const bottom = useRef<HTMLDivElement>(null)

  const list = useQuery({ queryKey: keys.conversations, queryFn: api.conversations })
  const activeId = selection === 'nueva' ? null : (selection ?? list.data?.[0]?.id ?? null)
  const thread = useQuery({
    queryKey: [...keys.conversations, activeId],
    queryFn: () => api.conversation(activeId!),
    enabled: activeId !== null,
  })

  const send = useMutation({
    mutationFn: async (text: string) => {
      const id = activeId ?? (await api.createConversation()).id
      setSelection(id)
      return api.send(id, text)
    },
    onMutate: (text) => {
      setOptimistic(text)
      onThinking(true)
    },
    onSettled: async () => {
      setOptimistic(null)
      onThinking(false)
      await client.invalidateQueries({ queryKey: keys.conversations })
    },
  })

  const remove = useMutation({
    mutationFn: api.deleteConversation,
    onSuccess: async (_, id) => {
      if (id === activeId) setSelection(null)
      await client.invalidateQueries({ queryKey: keys.conversations })
    },
  })

  // La pregunta de la barra (Ctrl+K) se envía a la conversación abierta
  useEffect(() => {
    if (!incoming || send.isPending) return
    send.mutate(incoming)
    onIncomingHandled()
  }, [incoming, send, onIncomingHandled])

  const messages: ChatMessage[] = thread.data?.messages ?? []
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, optimistic])

  const submit = () => {
    const text = draft.trim()
    if (text.length < 2 || send.isPending) return
    setDraft('')
    send.mutate(text)
  }

  return (
    <div className="flex h-full min-h-0">
      <aside
        aria-label="Conversaciones"
        className="border-tinta flex w-72 shrink-0 flex-col border-r-[1.5px]"
      >
        <div className="border-tinta border-b-[1.5px] p-4">
          <button
            type="button"
            className="boton w-full justify-center"
            onClick={() => {
              setSelection('nueva')
              setDraft('')
            }}
          >
            Nueva conversación
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {list.data?.length === 0 && (
            <li className="text-grafito p-4 text-sm">Todavía no hay conversaciones.</li>
          )}
          {list.data?.map((c) => (
            <li key={c.id} className="group relative">
              <button
                type="button"
                onClick={() => setSelection(c.id)}
                aria-current={c.id === activeId ? 'true' : undefined}
                className="border-rejilla hover:bg-papel-claro aria-[current=true]:bg-tinta aria-[current=true]:text-papel flex w-full cursor-pointer flex-col gap-0.5 border-b px-4 py-3 pr-10 text-left"
              >
                <span className="truncate text-sm font-medium">{c.title}</span>
                <span className="text-xs opacity-70">
                  {c.messages} {c.messages === 1 ? 'mensaje' : 'mensajes'} · {ago(c.updatedAt)}
                </span>
              </button>
              <button
                type="button"
                aria-label={`Borrar «${c.title}»`}
                title="Borrar conversación"
                className="text-grafito group-aria-[current=true]:text-papel hover:text-bermellon absolute top-3 right-2 hidden cursor-pointer px-2 font-mono text-sm group-hover:block"
                onClick={() => {
                  if (window.confirm(`¿Borrar «${c.title}»? No se puede deshacer.`)) remove.mutate(c.id)
                }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section aria-label="Mensajes" className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {messages.length === 0 && !optimistic ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <NexoLogo state={send.isPending ? 'pensando' : 'reposo'} size={96} />
              <h1 className="font-display text-3xl">¿En qué te ayudo?</h1>
              <p className="text-tinta-suave max-w-md">
                Pregúntame por tu PC: espacio, proyectos, actualizaciones o lo que proponen tus agentes.
                Recuerdo lo que hablemos en esta conversación, y nada sale de tu computadora.
              </p>
            </div>
          ) : (
            <ol className="mx-auto flex max-w-3xl flex-col gap-4">
              {messages.map((m) => (
                <Bubble key={m.id} message={m} onNavigate={onNavigate} />
              ))}
              {optimistic && (
                <>
                  <Bubble message={{ role: 'user', content: optimistic }} onNavigate={onNavigate} />
                  <li className="text-grafito flex items-center gap-3">
                    <NexoLogo state="pensando" size={44} />
                    <span className="text-sm">Pensando…</span>
                  </li>
                </>
              )}
            </ol>
          )}
          <div ref={bottom} />
        </div>

        {send.isError && (
          <p role="alert" className="text-bermellon px-8 pb-2 text-sm">
            {send.error.message}
          </p>
        )}
        <form
          className="border-tinta flex items-stretch gap-3 border-t-[1.5px] p-4"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <label htmlFor="mensaje" className="sr-only">
            Mensaje para Nexo
          </label>
          <textarea
            id="mensaje"
            value={draft}
            maxLength={500}
            rows={2}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Enter envía; Shift+Enter hace un salto de línea
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                submit()
              }
            }}
            placeholder="Escríbele a Nexo…  (Enter para enviar)"
            className="tarjeta placeholder:text-grafito focus-visible:border-cobalto min-w-0 flex-1 resize-none px-4 py-2.5 outline-none"
          />
          <button
            type="submit"
            className="boton self-end"
            disabled={send.isPending || draft.trim().length < 2}
            aria-busy={send.isPending}
          >
            Enviar
          </button>
        </form>
      </section>
    </div>
  )
}

function Bubble({
  message,
  onNavigate,
}: {
  message: Pick<ChatMessage, 'role' | 'content'> & Partial<ChatMessage>
  onNavigate: (view: View) => void
}) {
  if (message.role === 'user') {
    return (
      <li className="flex justify-end">
        <p
          data-copiable
          className="border-tinta bg-tinta text-papel max-w-[80%] border-[1.5px] px-4 py-2.5 whitespace-pre-line"
        >
          {message.content}
        </p>
      </li>
    )
  }
  return (
    <li className="flex gap-3">
      <NexoLogo state="reposo" size={32} decorative />
      <div className="flex max-w-[85%] flex-col gap-2">
        <div data-copiable className="tarjeta flex flex-col gap-3 px-4 py-3 leading-relaxed">
          <RichText text={message.content} />
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {message.intent === 'ver_aprobaciones' && (
            <button type="button" className="boton py-1" onClick={() => onNavigate('aprobaciones')}>
              Ir a Aprobaciones
            </button>
          )}
          {message.pid && (
            <button type="button" className="boton py-1" onClick={() => onNavigate('bitacora')}>
              Ver al {message.agent} trabajando
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

const LIST_ITEM = /^\s*(?:[-•*]|\d+[.)])\s+/

/**
 * Las respuestas del modelo traen listas con guiones: se muestran como listas de verdad.
 * Solo se reconocen párrafos y listas; el texto nunca se interpreta como HTML.
 */
export function RichText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/)
  return blocks.map((block, i) => {
    const lines = block.split('\n').filter((l) => l.trim())
    const items = lines.filter((l) => LIST_ITEM.test(l))
    if (items.length === 0) {
      return (
        <p key={i} className="whitespace-pre-line">
          {block}
        </p>
      )
    }
    // Un párrafo puede terminar en dos puntos y seguir con la lista, sin línea en blanco
    const intro = lines.slice(0, lines.indexOf(items[0]!))
    const ordered = /^\s*\d/.test(items[0]!)
    const List = ordered ? 'ol' : 'ul'
    return (
      <div key={i} className="flex flex-col gap-1.5">
        {intro.length > 0 && <p>{intro.join(' ')}</p>}
        <List
          className={`flex flex-col gap-1 pl-5 ${ordered ? 'list-decimal' : 'marker:text-cobalto list-disc'}`}
        >
          {lines.slice(intro.length).map((line, j) => (
            <li key={j}>{line.replace(LIST_ITEM, '')}</li>
          ))}
        </List>
      </div>
    )
  })
}
