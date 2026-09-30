import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Action } from '../lib/types'
import { ApprovalsView, splitTitle } from './ApprovalsView'

const GB = 1024 ** 3
const action = (id: number, title: string, bytes: number): Action => ({
  id,
  agent: 'inventario',
  tool: 'archivos.cuarentena',
  title,
  detail: 'En Descargas, sin abrir desde hace meses.',
  bytes,
  state: 'pending',
  createdAt: '2026-09-29T15:00:00Z',
  decidedAt: null,
  executedAt: null,
  error: null,
})

const decide = vi.fn<(id: number, verb: string) => Promise<Action>>(async (id) => ({
  ...action(id, 'x', 0),
  state: 'done',
}))

vi.mock('../lib/api', () => ({
  ApiError: class extends Error {},
  api: {
    pendingActions: async () => [
      action(1, 'Mover a cuarentena «juego.zip»', 35 * GB),
      action(2, 'Apartar caché de pip', 6 * GB),
    ],
    undoableActions: async () => [],
    agents: async () => [{ name: 'inventario', title: 'Inventario' }],
    decide: (id: number, verb: string) => decide(id, verb),
  },
}))

describe('ApprovalsView', () => {
  it('muestra cuánto liberarían y manda la decisión de cada acción', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <ApprovalsView />
      </QueryClientProvider>,
    )
    expect(await screen.findByText('41 GB')).toBeInTheDocument()
    // El nombre del archivo va primero; la acción y quién la propuso, debajo
    expect(screen.getByText('juego.zip')).toBeInTheDocument()
    expect(await screen.findByText('Mover a cuarentena. Lo propuso Inventario.')).toBeInTheDocument()

    const user = userEvent.setup()
    const [aprobar] = screen.getAllByRole('button', { name: 'Aprobar' })
    await user.click(aprobar!)
    expect(decide).toHaveBeenCalledWith(1, 'aprobar')

    const rechazar = screen.getAllByRole('button', { name: 'Rechazar' })[1]!
    await user.click(rechazar)
    expect(decide).toHaveBeenCalledWith(2, 'rechazar')
  })
})

describe('splitTitle', () => {
  it('separa el archivo de la acción; un título sin comillas queda igual', () => {
    expect(splitTitle('Mover a cuarentena «a «b».zip»')).toEqual({
      what: 'a «b».zip',
      verb: 'Mover a cuarentena',
    })
    expect(splitTitle('Apartar caché de pip')).toEqual({ what: 'Apartar caché de pip', verb: null })
  })
})
