import { startDemo } from '../src/glove/demo'
import { openSerialGlove } from '../src/glove/serial'
import { GloveEvent, GloveReading } from '../src/glove/types'

let fails = 0
const check = (c: boolean, m: string) => { if (!c) { console.log('  FAIL:', m); fails++ } }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  console.log('demo glove: GOTO:45')
  const r1: GloveReading[] = []; const e1: GloveEvent[] = []
  const demo = startDemo({ onReading: (r) => r1.push(r), onEvent: (e) => e1.push(e), onClosed: () => {} })
  await sleep(120); demo.send('GOTO:45'); await sleep(1500)
  const last = r1[r1.length - 1]
  check(e1.some((e) => e.event === 'REACHED'), 'REACHED event')
  check(last.angles[1]! >= 44 && last.angles[1]! <= 48, 'angle near 45 (got ' + last.angles[1] + ')')
  check(last.motor === 'idle', 'motor idle')
  demo.send('CLOSE'); await sleep(2300); check(e1.some((e) => e.event === 'JOG_DONE' || e.event === 'LIMIT'), 'jog stops by itself (JOG_DONE or LIMIT)')
  await demo.close()

  console.log('usb glove with a fake port')
  let push!: (s: string) => void; const written: string[] = []; let portClosed = false
  const port = {
    open: async () => {},
    close: async () => { portClosed = true },
    readable: new ReadableStream<Uint8Array>({ start(c) { push = (s) => c.enqueue(new TextEncoder().encode(s)) } }),
    writable: new WritableStream<Uint8Array>({ write(ch) { written.push(new TextDecoder().decode(ch)) } }),
  }
  Object.defineProperty(globalThis, 'navigator', { value: { serial: { requestPort: async () => port } }, configurable: true })
  const r2: GloveReading[] = []; const e2: GloveEvent[] = []
  const usb = await openSerialGlove({ onReading: (r) => r2.push(r), onEvent: (e) => e2.push(e), onClosed: () => {} })
  push('ets Jun  8 2016 boot garbage\r\n{"event":"READY","angle":0.0}\r\n{"angles":[null,37.5,nu')   // line split across chunks
  await sleep(30); push('ll,null,null],"raw":1843,"motor":"idle","calibrated":true}\r\n{broken json\r\n')
  await sleep(50)
  check(e2.length === 1 && e2[0].event === 'READY', 'event parsed, boot noise ignored')
  check(r2.length === 1 && r2[0].angles[1] === 37.5 && r2[0].raw === 1843 && r2[0].calibrated, 'split reading reassembled')
  usb.send('GOTO:45'); await sleep(30)
  check(written.join('') === 'GOTO:45\n', 'command sent with newline (got ' + JSON.stringify(written.join('')) + ')')
  await usb.close()
  check(written.join('').endsWith('STOP\n'), 'STOP sent when disconnecting')
  check(portClosed, 'port closed')

  console.log('no Web Serial support')
  Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true })
  let msg = ''; try { await openSerialGlove({ onReading() {}, onEvent() {}, onClosed() {} }) } catch (e) { msg = (e as Error).message }
  check(/Chrome or Edge/.test(msg), 'friendly unsupported-browser message')

  console.log(fails ? `\n${fails} FAILED` : '\nALL TESTS PASSED'); process.exit(fails ? 1 : 0)
}
main()
