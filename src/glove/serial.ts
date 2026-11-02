import { GloveHandlers, GloveLink } from './types'

/** USB serial reader. Accepts both dashboard JSON firmware and the user's
 * working Serial Monitor format: INDEX: 12 deg | MIDDLE: 20 deg | ... */
export async function openSerialGlove(h: GloveHandlers): Promise<GloveLink> {
  const serial = (navigator as unknown as { serial?: any }).serial
  if (!serial) throw new Error('USB serial is unavailable. Use Chrome or Edge on a laptop.')
  const port = await serial.requestPort()
  try { await port.open({ baudRate: 115200 }) }
  catch { throw new Error('Could not open the glove. Close Arduino Serial Monitor and any other app using the port, then reconnect.') }

  const decoder = new TextDecoderStream()
  const piped = port.readable.pipeTo(decoder.writable).catch(() => undefined)
  const reader = decoder.readable.getReader()
  const writer = port.writable.getWriter()
  const encoder = new TextEncoder()
  let alive = true

  function parseLine(line: string) {
    const clean = line.trim()
    if (!clean) return
    if (clean.startsWith('{')) {
      try {
        const o = JSON.parse(clean)
        if (Array.isArray(o.angles) && o.angles.length >= 5) {
          h.onReading({ angles: o.angles.slice(0, 5).map((v: unknown) => typeof v === 'number' && Number.isFinite(v) ? v : null), raw: typeof o.raw === 'number' ? o.raw : null, motor: String(o.motor ?? 'idle'), calibrated: Boolean(o.calibrated) })
        } else if (o.event) h.onEvent(o)
      } catch { /* ignore incomplete or malformed JSON */ }
      return
    }
    // Legacy demo output, e.g. INDEX: 12.0 deg | MIDDLE: 25.0 deg ...
    const names = ['THUMB', 'INDEX', 'MIDDLE', 'RING', 'LITTLE']
    const values: (number | null)[] = [null, null, null, null, null]
    let found = 0
    for (const name of names) {
      const match = clean.match(new RegExp(`\\b${name}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)\\s*(?:deg)?`, 'i'))
      if (match) { values[names.indexOf(name)] = Math.max(0, Math.min(90, Number(match[1]))); found++ }
    }
    if (found > 0) {
      const motorMatch = clean.match(/MOTOR\s*:\s*(OPEN|CLOSE|STOP)/i)
      h.onReading({ angles: values, raw: null, motor: motorMatch ? motorMatch[1].toLowerCase() : 'idle', calibrated: true })
    }
  }

  ;(async () => {
    let buf = ''
    try {
      while (alive) {
        const { value, done } = await reader.read()
        if (done) break
        buf += value
        let i: number
        while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); parseLine(line) }
        if (buf.length > 4096) buf = buf.slice(-1024)
      }
    } catch { /* unplugged */ }
    finally { if (alive) { alive = false; h.onClosed() } }
  })()

  return {
    send(cmd) { writer.write(encoder.encode(cmd + '\n')).catch(() => undefined) },
    async close() {
      alive = false
      try { await writer.write(encoder.encode('STOP\n')) } catch { /* ignore */ }
      await reader.cancel().catch(() => undefined)
      await piped
      writer.releaseLock()
      await port.close().catch(() => undefined)
    },
  }
}
