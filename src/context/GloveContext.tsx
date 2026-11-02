import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react'
import { GloveEvent, GloveLink, GloveReading } from '../glove/types'
import { startDemo } from '../glove/demo'
import { openSerialGlove } from '../glove/serial'

type Mode = 'none' | 'demo' | 'usb'
interface GloveValue {
  mode: Mode
  connecting: boolean
  error: string
  reading: GloveReading | null
  events: GloveEvent[]
  connectUsb: () => Promise<void>
  connectDemo: () => void
  disconnect: () => Promise<void>
  send: (cmd: string) => void
}
const Ctx = createContext<GloveValue | null>(null)

export function GloveProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('none')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [reading, setReading] = useState<GloveReading | null>(null)
  const [events, setEvents] = useState<GloveEvent[]>([])
  const link = useRef<GloveLink | null>(null)

  const handlers = (label: Mode) => ({
    onReading: setReading,
    onEvent: (e: GloveEvent) => setEvents((prev) => [e, ...prev].slice(0, 8)),
    onClosed: () => { link.current = null; setMode('none'); setReading(null); if (label === 'usb') setError('The glove was disconnected.') },
  })

  const disconnect = useCallback(async () => {
    const l = link.current
    link.current = null
    setMode('none'); setReading(null)
    if (l) await l.close().catch(() => undefined)
  }, [])

  const connectUsb = useCallback(async () => {
    setError(''); setConnecting(true)
    try {
      if (link.current) await disconnect()
      link.current = await openSerialGlove(handlers('usb'))
      setMode('usb')
    } catch (e) {
      const m = (e as Error).message
      if (!/No port selected|cancel/i.test(m)) setError(m)
    } finally { setConnecting(false) }
  }, [disconnect])

  const connectDemo = useCallback(() => {
    setError('')
    if (link.current) void link.current.close()
    link.current = startDemo(handlers('demo'))
    setMode('demo')
  }, [])

  const send = useCallback((cmd: string) => link.current?.send(cmd), [])

  return <Ctx.Provider value={{ mode, connecting, error, reading, events, connectUsb, connectDemo, disconnect, send }}>{children}</Ctx.Provider>
}

export function useGlove() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useGlove must be used inside GloveProvider')
  return v
}
