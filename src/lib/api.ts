import { invoke, isTauri } from '@tauri-apps/api/core'

import type {
  Action,
  AgentInfo,
  Answer,
  ChatMessage,
  ConversationSummary,
  JournalEvent,
  Process,
  Report,
} from './types'

export const API = 'http://127.0.0.1:4747'

/**
 * El token lo lee la parte nativa desde %LOCALAPPDATA%\Nexo y llega por IPC.
 * Se guarda solo en memoria; si el servicio lo rota, se vuelve a pedir.
 */
let token: string | null = null

async function getToken(refresh = false): Promise<string> {
  // Vista previa en el navegador (solo desarrollo): el token llega por variable de entorno
  if (!isTauri() && import.meta.env.DEV) return import.meta.env.VITE_NEXO_TOKEN ?? ''
  if (!token || refresh) token = await invoke<string>('service_token')
  return token
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

export async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${await getToken()}` },
  })
  // Token viejo (el servicio se reinició con uno nuevo): se relee una vez
  if (res.status === 401 && !retried) {
    await getToken(true)
    return request(path, init, true)
  }
  if (!res.ok) throw new ApiError(res.status, `${path} respondió ${res.status}`)
  return (await res.json()) as T
}

export async function isServiceUp(): Promise<boolean> {
  try {
    const res = await fetch(`${API}/estado`, { signal: AbortSignal.timeout(800) })
    return res.ok
  } catch {
    return false
  }
}

export const api = {
  report: () => request<Report>('/parte'),
  agents: () => request<AgentInfo[]>('/agentes'),
  processes: (n = 30) => request<Process[]>(`/ps?n=${n}`),
  journal: (n = 80) => request<JournalEvent[]>(`/logs?n=${n}`),
  runAgent: (name: string) =>
    request<{ pid: number }>(`/ejecutar/${encodeURIComponent(name)}`, { method: 'POST' }),
  pendingActions: () => request<Action[]>('/acciones?estado=pendientes'),
  undoableActions: () => request<Action[]>('/acciones?estado=deshacibles'),
  decide: (id: number, verb: 'aprobar' | 'rechazar' | 'deshacer') =>
    request<Action>(`/acciones/${id}/${verb}`, { method: 'POST' }),
  ask: (texto: string) =>
    request<Answer>('/preguntar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    }),
  conversations: () => request<ConversationSummary[]>('/conversaciones'),
  conversation: (id: number) =>
    request<{ conversation: ConversationSummary; messages: ChatMessage[] }>(`/conversaciones/${id}`),
  createConversation: () => request<ConversationSummary>('/conversaciones', { method: 'POST' }),
  deleteConversation: (id: number) => request<{ ok: boolean }>(`/conversaciones/${id}`, { method: 'DELETE' }),
  send: (id: number, texto: string) =>
    request<ChatMessage>(`/conversaciones/${id}/mensajes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    }),
  refreshAll: () => request<{ ok: boolean }>('/iniciar-sesion', { method: 'POST' }),
  /** Flujo de la bitácora en vivo. EventSource no permite enviar el token, por eso fetch. */
  async events(signal: AbortSignal): Promise<ReadableStream<Uint8Array>> {
    const res = await fetch(`${API}/eventos`, {
      headers: { Authorization: `Bearer ${await getToken()}` },
      signal,
    })
    if (!res.ok || !res.body) throw new ApiError(res.status, 'No se pudo abrir la bitácora en vivo')
    return res.body
  },
}
