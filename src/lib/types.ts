/** Tipos de la API del núcleo (ver nexo-os/src/kernel). */
export type Level = 'info' | 'suggestion' | 'warning'

export type ReportItem = {
  agent: string
  agentTitle: string
  level: Level
  title: string
  detail: string | null
  bytes: number | null
}

export type Report = {
  generatedAt: string
  agents: { name: string; title: string; checkedAt: string | null; state: string | null }[]
  items: ReportItem[]
  reclaimableBytes: number
  pendingActions?: number
  summary?: { text: string; source: 'modelo' | 'plantilla'; at: string } | null
  assistant?: boolean
  userName?: string
}

export type Risk = 'read' | 'write' | 'external'

export type RunSummary = { warning: number; suggestion: number; info: number }

export type AgentInfo = {
  name: string
  title: string
  description: string
  everyMinutes: number
  onLogin: boolean
  capabilities: { name: string; risk: Risk | null }[]
  lastRun: { pid: number; state: ProcessState; finishedAt: string | null; summary: RunSummary } | null
}

export type ProcessState = 'ready' | 'running' | 'done' | 'failed' | 'interrupted' | 'killed'

export type Process = {
  pid: number
  agent: string
  state: ProcessState
  trigger: 'schedule' | 'login' | 'manual' | 'retry' | 'followup'
  attempt: number
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  error: string | null
}

export type JournalEvent = {
  id: number
  at: string
  pid: number | null
  agent: string | null
  type: string
  data: Record<string, unknown>
}

export type ActionState = 'pending' | 'running' | 'done' | 'failed' | 'rejected' | 'undone' | 'purged'

export type Action = {
  id: number
  agent: string
  tool: string
  title: string
  detail: string | null
  bytes: number | null
  state: ActionState
  createdAt: string
  decidedAt: string | null
  executedAt: string | null
  error: string | null
}

export type Answer = {
  intencion: 'responder' | 'ejecutar_agente' | 'ver_aprobaciones' | 'fuera_de_alcance'
  agente: string | null
  respuesta: string
  pid: number | null
}

export type ConversationSummary = { id: number; title: string; updatedAt: string; messages: number }

export type ChatMessage = {
  id: number
  conversationId: number
  role: 'user' | 'assistant'
  content: string
  intent: Answer['intencion'] | null
  agent: string | null
  pid: number | null
  createdAt: string
}

export type RunChange =
  | { kind: 'nuevo' | 'resuelto'; level: Level; title: string }
  | { kind: 'cambio'; level: Level; before: string; after: string }

export type RunDetails = {
  process: Process
  steps: JournalEvent[]
  findings: { id: number; level: Level; title: string; detail: string | null; bytes: number | null }[]
  summary: RunSummary
  proposals: Action[]
  changes: RunChange[] | null
  previousAt: string | null
}
