export type SseMessage = { event: string; data: string }

/**
 * Lector incremental de Server-Sent Events: recibe trozos de texto como lleguen
 * (un mensaje puede partirse entre dos trozos) y devuelve los mensajes completos.
 */
export function createSseParser() {
  let buffer = ''
  return (chunk: string): SseMessage[] => {
    buffer += chunk.replace(/\r\n/g, '\n')
    const messages: SseMessage[] = []
    let end: number
    while ((end = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, end)
      buffer = buffer.slice(end + 2)
      let event = 'message'
      const data: string[] = []
      for (const line of block.split('\n')) {
        if (line.startsWith(':')) continue // comentario
        const colon = line.indexOf(':')
        const field = colon === -1 ? line : line.slice(0, colon)
        const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '')
        if (field === 'event') event = value
        else if (field === 'data') data.push(value)
      }
      if (data.length) messages.push({ event, data: data.join('\n') })
    }
    return messages
  }
}
