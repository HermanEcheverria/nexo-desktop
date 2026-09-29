import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Report } from '../lib/types'
import { ReportView } from './ReportView'

const GB = 1024 ** 3
const report: Report = {
  generatedAt: '2026-09-29T15:00:00Z',
  agents: [{ name: 'jardinero', title: 'Jardinero', checkedAt: '2026-09-29T15:00:00Z', state: 'done' }],
  reclaimableBytes: 85 * GB,
  items: [
    {
      agent: 'jardinero',
      agentTitle: 'Jardinero',
      level: 'warning',
      title: 'nexo-os: 12 archivos sin commit',
      detail: 'En la rama main.',
      bytes: null,
    },
    {
      agent: 'limpiador',
      agentTitle: 'Limpiador',
      level: 'suggestion',
      title: '16.8 GB en cachés',
      detail: null,
      bytes: 16.8 * GB,
    },
    {
      agent: 'inventario',
      agentTitle: 'Inventario',
      level: 'info',
      title: 'Disco C: · 435 GB libres',
      detail: null,
      bytes: null,
    },
  ],
}

vi.mock('../lib/api', () => ({ api: { report: async () => report, refreshAll: vi.fn() } }))

function renderWithClient() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ReportView name="Andrés" />
    </QueryClientProvider>,
  )
}

describe('ReportView', () => {
  it('muestra el espacio a liberar y ordena por urgencia', async () => {
    renderWithClient()
    expect(await screen.findByText('85 GB')).toBeInTheDocument()
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(['Requiere atención', 'Podrías hacer', 'Estado de tu PC'])
    // La urgencia no depende solo del color: cada marca tiene su etiqueta
    expect(screen.getByLabelText('Alerta')).toBeInTheDocument()
  })

  it('no repite el tamaño si el título ya lo dice', async () => {
    renderWithClient()
    await screen.findByText('16.8 GB en cachés')
    expect(screen.queryAllByText('16.8 GB')).toHaveLength(0)
  })
})
