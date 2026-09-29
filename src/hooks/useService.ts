import { invoke, isTauri } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'

import { isServiceUp } from '../lib/api'

export type ServiceStatus = 'checking' | 'starting' | 'ready' | 'unreachable'

/** Tiempo máximo esperando a que el núcleo encienda en WSL (la primera vez tarda más). */
const START_TIMEOUT_MS = 45_000

/**
 * Se asegura de que el núcleo esté corriendo: si no responde, la parte nativa lo
 * enciende en WSL y aquí se espera hasta que conteste.
 */
export function useService() {
  const [status, setStatus] = useState<ServiceStatus>('checking')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      if (await isServiceUp()) {
        if (!cancelled) setStatus('ready')
        return
      }
      setStatus('starting')
      if (isTauri()) await invoke('ensure_service').catch(() => undefined)
      const deadline = Date.now() + START_TIMEOUT_MS
      while (!cancelled && Date.now() < deadline) {
        if (await isServiceUp()) {
          setStatus('ready')
          return
        }
        await new Promise((r) => setTimeout(r, 1000))
      }
      if (!cancelled) setStatus('unreachable')
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [attempt])

  // Mientras está listo, se vigila: si el núcleo se cae, se intenta de nuevo
  useEffect(() => {
    if (status !== 'ready') return
    const timer = setInterval(async () => {
      if (!(await isServiceUp())) setAttempt((a) => a + 1)
    }, 10_000)
    return () => clearInterval(timer)
  }, [status])

  return { status, retry: () => setAttempt((a) => a + 1) }
}
