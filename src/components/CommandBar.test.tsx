import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Answer } from '../lib/types'
import { CommandBar } from './CommandBar'

const ask = vi.fn<(texto: string) => Promise<Answer>>(async () => ({
  intencion: 'ver_aprobaciones',
  agente: null,
  respuesta: 'Hay 8 propuestas que liberarían 4.9 GB.',
  pid: null,
}))
vi.mock('../lib/api', () => ({ api: { ask: (t: string) => ask(t) } }))

describe('CommandBar', () => {
  it('manda la pregunta, muestra la respuesta y lleva a Aprobaciones', async () => {
    const onNavigate = vi.fn()
    render(
      <QueryClientProvider client={new QueryClient()}>
        <CommandBar onNavigate={onNavigate} />
      </QueryClientProvider>,
    )
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Pregúntale a Nexo'), 'libera espacio{Enter}')
    expect(ask).toHaveBeenCalledWith('libera espacio')
    expect(await screen.findByText('Hay 8 propuestas que liberarían 4.9 GB.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ir a Aprobaciones →' }))
    expect(onNavigate).toHaveBeenCalledWith('aprobaciones')
  })
})
