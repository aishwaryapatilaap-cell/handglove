import { GloveHandlers, GloveLink } from './types'

/** A simulated glove so the whole site works with no hardware. Same commands as the real firmware. */
export function startDemo(h: GloveHandlers): GloveLink {
  let angle = 5
  let mode: 'idle' | 'closing' | 'opening' = 'idle'
  let target: number | null = null
  let jogUntil = 0
  const SPEED = 45 // degrees per second, similar to the real finger

  const finish = (name: string) => { mode = 'idle'; target = null; h.onEvent({ event: name, angle: Math.round(angle * 10) / 10 }) }

  const timer = setInterval(() => {
    const dt = 0.05
    if (mode === 'closing') angle += SPEED * dt
    if (mode === 'opening') angle -= SPEED * dt
    angle = Math.max(-5, Math.min(95, angle))
    if (target !== null) {
      if (mode === 'closing' && angle >= target - 0.5) finish('REACHED')
      else if (mode === 'opening' && angle <= target + 0.5) finish('REACHED')
    } else if (mode !== 'idle') {
      if (Date.now() >= jogUntil) finish('JOG_DONE')
      else if (angle >= 95 || angle <= -5) finish('LIMIT')
    }
    const shown = Math.round(Math.max(0, Math.min(90, angle)) * 10) / 10
    h.onReading({ angles: [null, shown, null, null, null], raw: Math.round(600 + (shown / 90) * 2800), motor: mode, calibrated: true })
  }, 50)

  return {
    send(cmd) {
      if (cmd === 'STOP') { if (mode !== 'idle') finish('STOPPED') }
      else if (cmd === 'OPEN' || cmd === 'CLOSE') { target = null; mode = cmd === 'CLOSE' ? 'closing' : 'opening'; jogUntil = Date.now() + 2000 }
      else if (cmd.startsWith('GOTO:')) {
        const t = Math.max(0, Math.min(90, parseFloat(cmd.slice(5))))
        if (Math.abs(t - angle) <= 0.5) { h.onEvent({ event: 'REACHED', angle }); return }
        target = t; mode = t > angle ? 'closing' : 'opening'
      } else if (cmd === 'CAL_OPEN') h.onEvent({ event: 'CAL_OPEN_SET', raw: 600 })
      else if (cmd === 'CAL_CLOSED') h.onEvent({ event: 'CAL_CLOSED_SET', raw: 3400 })
    },
    async close() { clearInterval(timer) },
  }
}
