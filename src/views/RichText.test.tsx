import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RichText } from './ConversationsView'

describe('RichText', () => {
  it('convierte los guiones del modelo en una lista, con su párrafo de entrada', () => {
    const { container } = render(
      <RichText
        text={'Tienes 2 propuestas.\n\nLas propuestas son:\n- Mover «a.exe»\n- Mover «b.zip»\n\nListo.'}
      />,
    )
    expect(screen.getByText('Las propuestas son:')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'Mover «a.exe»',
      'Mover «b.zip»',
    ])
    expect(container.querySelectorAll('p')).toHaveLength(3)
  })

  it('no interpreta HTML: el texto se muestra tal cual', () => {
    render(<RichText text={'<img src=x onerror=alert(1)>'} />)
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
  })
})
