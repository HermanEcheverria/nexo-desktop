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
}

export type AgentInfo = {
  name: string
  title: string
  description: string
  everyMinutes: number
  onLogin: boolean
  capabilities: string[]
}

export type ProcessState = 'ready' | 'running' | 'done' | 'failed' | 'interrupted' | 'killed'

export type Process = {
  pid: number
  agent: string
  state: ProcessState
  trigger: 'schedule' | 'login' | 'manual' | 'retry'
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
