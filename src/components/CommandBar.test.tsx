import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CommandBar } from './CommandBar'

describe('CommandBar', () => {
  it('envía la pregunta escrita o un ejemplo a la conversación', async () => {
    const onAsk = vi.fn()
    render(<CommandBar onAsk={onAsk} />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Pregúntale a Nexo'), 'libera espacio{Enter}')
    expect(onAsk).toHaveBeenCalledWith('libera espacio')

    await user.click(screen.getByRole('button', { name: 'Revisa de nuevo mis proyectos' }))
    expect(onAsk).toHaveBeenLastCalledWith('Revisa de nuevo mis proyectos')
  })
})
