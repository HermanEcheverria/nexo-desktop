import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { RunDetails } from '../lib/types'
import { RunPanel, summaryText } from './RunPanel'

const details: RunDetails = {
  process: {
    pid: 42,
    agent: 'centinela',
    state: 'done',
    trigger: 'manual',
    attempt: 1,
    createdAt: '2026-09-29T20:00:00Z',
    startedAt: '2026-09-29T20:00:00Z',
    finishedAt: '2026-09-29T20:00:04Z',
    error: null,
  },
  steps: [],
  findings: [
    { id: 1, level: 'info', title: 'Firewall activo en todas las redes', detail: null, bytes: null },
    {
      id: 2,
      level: 'warning',
      title: 'PostgreSQL acepta conexiones desde toda la red (puerto 5432)',
      detail: 'Proceso: postgres.',
      bytes: null,
    },
  ],
  summary: { warning: 1, suggestion: 0, info: 1 },
  proposals: [],
  changes: [
    {
      kind: 'nuevo',
      level: 'warning',
      title: 'PostgreSQL acepta conexiones desde toda la red (puerto 5432)',
    },
    { kind: 'resuelto', level: 'warning', title: 'No hay ningún antivirus activo' },
  ],
  previousAt: '2026-09-29T08:00:00Z',
}

vi.mock('../lib/api', () => ({ api: { run: async () => details } }))

describe('RunPanel', () => {
  it('muestra qué cambió y los hallazgos, lo urgente primero', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RunPanel pid={42} liveEvents={[]} onNavigate={() => {}} />
      </QueryClientProvider>,
    )
    expect(await screen.findByText('Qué cambió desde la revisión anterior')).toBeInTheDocument()
    expect(screen.getByText('✓ Resuelto')).toBeInTheDocument()
    expect(screen.getByText('No hay ningún antivirus activo')).toBeInTheDocument()
    const titles = screen.getAllByText(/PostgreSQL acepta|Firewall activo/).map((e) => e.textContent)
    // En la lista de hallazgos, la alerta va antes que el dato
    expect(titles.at(-2)).toMatch(/PostgreSQL/)
    expect(titles.at(-1)).toMatch(/Firewall/)
    expect(screen.getByText(/en 4.0 s: 1 alerta · 1 dato/)).toBeInTheDocument()
  })

  it('resume los conteos en palabras', () => {
    expect(summaryText({ warning: 0, suggestion: 2, info: 1 })).toBe('2 sugerencias · 1 dato')
    expect(summaryText({ warning: 0, suggestion: 0, info: 0 })).toBe('sin hallazgos')
  })
})
