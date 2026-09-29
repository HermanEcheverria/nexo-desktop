import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../lib/api'

export const keys = {
  report: ['parte'] as const,
  agents: ['agentes'] as const,
  processes: ['procesos'] as const,
}

export const useReport = () => useQuery({ queryKey: keys.report, queryFn: api.report })
export const useAgents = () => useQuery({ queryKey: keys.agents, queryFn: api.agents, staleTime: Infinity })
export const useProcesses = () => useQuery({ queryKey: keys.processes, queryFn: () => api.processes() })

export function useRunAgent() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: api.runAgent,
    onSettled: () => client.invalidateQueries(),
  })
}

export function useRefreshAll() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: api.refreshAll,
    onSettled: () => client.invalidateQueries(),
  })
}
