import type { NexoState } from '../components/NexoLogo'
import type { ServiceStatus } from './useService'
import type { JournalEvent } from '../lib/types'

/**
 * El estado del logo sale de la bitácora en vivo, en orden de prioridad:
 * desconectado > pensando > trabajando > atención > reposo.
 */
export function nexoState({
  status,
  events,
  thinking = false,
  needsAttention = false,
}: {
  status: ServiceStatus
  events: JournalEvent[]
  thinking?: boolean
  needsAttention?: boolean
}): NexoState {
  if (status !== 'ready') return 'desconectado'

  const lastQuestion = events.findLast((e) => e.type === 'question')?.id ?? 0
  const lastAnswer = events.findLast((e) => e.type === 'answer' || e.type === 'answer_failed')?.id ?? 0
  if (thinking || lastQuestion > lastAnswer) return 'pensando'

  // Procesos que empezaron y todavía no terminan
  const running = new Set<number>()
  for (const e of events) {
    if (e.pid === null) continue
    if (e.type === 'start') running.add(e.pid)
    if (e.type === 'exit') running.delete(e.pid)
  }
  if (running.size > 0) return 'trabajando'

  return needsAttention ? 'atencion' : 'reposo'
}
