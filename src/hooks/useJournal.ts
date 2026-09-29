import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { api } from '../lib/api'
import { createSseParser } from '../lib/sse'
import type { JournalEvent } from '../lib/types'
import { keys } from './queries'

const MAX_EVENTS = 300

/**
 * Bitácora en vivo. Empieza con las últimas entradas guardadas y luego escucha el
 * flujo SSE del núcleo. Cuando un agente termina, se refrescan el parte y los procesos.
 */
export function useJournal(enabled: boolean) {
  const [events, setEvents] = useState<JournalEvent[]>([])
  const [live, setLive] = useState(false)
  const client = useQueryClient()

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()

    const add = (incoming: JournalEvent[]) =>
      setEvents((prev) => {
        const seen = new Set(prev.map((e) => e.id))
        const merged = [...prev, ...incoming.filter((e) => !seen.has(e.id))]
        return merged.slice(-MAX_EVENTS)
      })

    async function connect() {
      while (!controller.signal.aborted) {
        try {
          add(await api.journal())
          const reader = (await api.events(controller.signal)).getReader()
          const decoder = new TextDecoder()
          const parse = createSseParser()
          setLive(true)
          for (;;) {
            const { value, done } = await reader.read()
            if (done) break
            for (const message of parse(decoder.decode(value, { stream: true }))) {
              if (message.event !== 'bitacora') continue
              const event = JSON.parse(message.data) as JournalEvent
              add([event])
              if (event.type === 'exit' || event.type === 'start') {
                void client.invalidateQueries({ queryKey: keys.processes })
              }
              if (event.type === 'exit') void client.invalidateQueries({ queryKey: keys.report })
              if (
                ['proposal', 'action_done', 'action_failed', 'rejected', 'undone', 'purged'].includes(
                  event.type,
                )
              ) {
                void client.invalidateQueries({ queryKey: keys.actions })
                void client.invalidateQueries({ queryKey: keys.report })
              }
            }
          }
        } catch {
          // Se cayó la conexión: se reintenta en unos segundos
        }
        setLive(false)
        await new Promise((r) => setTimeout(r, 3000))
      }
    }
    void connect()
    return () => controller.abort()
  }, [enabled, client])

  return { events, live }
}
