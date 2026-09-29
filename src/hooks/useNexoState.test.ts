import { describe, expect, it } from 'vitest'

import type { JournalEvent } from '../lib/types'
import { nexoState } from './useNexoState'

let id = 0
const ev = (type: string, pid: number | null = null): JournalEvent => ({
  id: ++id,
  at: '',
  pid,
  agent: null,
  type,
  data: {},
})

describe('nexoState', () => {
  it('prioriza desconectado, luego pensando, luego trabajando', () => {
    const working = [ev('start', 1)]
    expect(nexoState({ status: 'starting', events: working })).toBe('desconectado')
    expect(nexoState({ status: 'ready', events: [...working, ev('question')] })).toBe('pensando')
    expect(nexoState({ status: 'ready', events: working })).toBe('trabajando')
  })

  it('vuelve a reposo cuando terminan los procesos y llega la respuesta', () => {
    const events = [ev('start', 2), ev('question'), ev('answer'), ev('exit', 2)]
    expect(nexoState({ status: 'ready', events })).toBe('reposo')
    expect(nexoState({ status: 'ready', events, needsAttention: true })).toBe('atencion')
  })
})
