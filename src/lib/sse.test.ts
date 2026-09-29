import { describe, expect, it } from 'vitest'

import { createSseParser } from './sse'

describe('createSseParser', () => {
  it('lee mensajes completos con su tipo', () => {
    const parse = createSseParser()
    expect(parse('event: bitacora\ndata: {"id":1}\n\nevent: latido\ndata: {}\n\n')).toEqual([
      { event: 'bitacora', data: '{"id":1}' },
      { event: 'latido', data: '{}' },
    ])
  })

  it('arma un mensaje que llega partido en varios trozos', () => {
    const parse = createSseParser()
    expect(parse('event: bitac')).toEqual([])
    expect(parse('ora\ndata: {"id"')).toEqual([])
    expect(parse(':2}\n\n')).toEqual([{ event: 'bitacora', data: '{"id":2}' }])
  })

  it('acepta saltos de línea de Windows, comentarios y datos en varias líneas', () => {
    const parse = createSseParser()
    expect(parse(': comentario\r\ndata: uno\r\ndata: dos\r\n\r\n')).toEqual([
      { event: 'message', data: 'uno\ndos' },
    ])
  })
})
