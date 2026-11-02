import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import HandSVG from '../components/HandSVG'

export default function NeuroFlap() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('neuroflap-highscore')) || 0)
  
  const [flexion, setFlexion] = useState(0)

  // Game Constants
  const BIRD_SIZE = 30
  const PIPE_WIDTH = 60
  const PIPE_GAP = 220
  const PIPE_SPEED = 3.5
  const GRAVITY = 0.25
  const LIFT_MULTIPLIER = 0.6 // How much lift you get from squeezing

  // Game State Refs
  const birdY = useRef(300)
  const birdVel = useRef(0)
  const pipes = useRef<{ x: number; top: number }[]>([])
  const frameId = useRef<number>(0)

  const resetGame = () => {
    birdY.current = 200
    birdVel.current = 0
    pipes.current = [
      { x: 600, top: 150 },
      { x: 1000, top: 200 }
    ]
    setScore(0)
    setGameOver(false)
    setGameStarted(false)
    setFlexion(0)
  }

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!gameStarted || gameOver) return
      const y = e.clientY
      const h = window.innerHeight
      // flex 0-100 based on mouse pos
      const flex = Math.max(0, Math.min(100, (y / h) * 100))
      setFlexion(flex)
    }
    window.addEventListener('mousemove', handleGlobalMouseMove)
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove)
  }, [gameStarted, gameOver])

  const update = useCallback(() => {
    if (gameOver || !gameStarted) return

    // Physics: Constant Gravity vs Squeeze Lift
    // 0 flexion = full gravity, 100 flexion = strong lift
    const lift = (flexion / 100) * LIFT_MULTIPLIER
    birdVel.current += GRAVITY - lift
    birdY.current += birdVel.current

    pipes.current.forEach(pipe => {
      pipe.x -= PIPE_SPEED
    })

    if (pipes.current[0].x < -PIPE_WIDTH) {
      pipes.current.shift()
      const lastPipe = pipes.current[pipes.current.length - 1]
      pipes.current.push({
        x: lastPipe.x + 400,
        top: Math.random() * (600 - PIPE_GAP - 120) + 60
      })
      setScore(s => s + 1)
    }

    const birdRect = { x: 100, y: birdY.current, w: BIRD_SIZE, h: BIRD_SIZE }
    pipes.current.forEach(pipe => {
      if (
        birdRect.x + birdRect.w > pipe.x &&
        birdRect.x < pipe.x + PIPE_WIDTH &&
        (birdRect.y < pipe.top || birdRect.y + birdRect.h > pipe.top + PIPE_GAP)
      ) {
        setGameOver(true)
      }
    })

    if (birdRect.y < -50 || birdRect.y + birdRect.h > 650) {
      setGameOver(true)
    }
  }, [flexion, gameOver, gameStarted])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#0a0a14'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)'
    ctx.lineWidth = 1
    for (let i = 0; i < canvas.width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke() }
    for (let i = 0; i < canvas.height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke() }

    // Pipes
    pipes.current.forEach(pipe => {
      const grad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0)
      grad.addColorStop(0, '#a855f7'); grad.addColorStop(1, '#6366f1')
      ctx.fillStyle = grad
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top)
      ctx.fillRect(pipe.x, pipe.top + PIPE_GAP, PIPE_WIDTH, 600 - (pipe.top + PIPE_GAP))
    })

    // Draw Flapping Bird
    ctx.save()
    ctx.translate(100, birdY.current)
    
    // Rotate bird based on velocity
    ctx.rotate(Math.max(-0.5, Math.min(0.5, birdVel.current * 0.1)))

    const flap = Math.sin(Date.now() / 100) > 0

    // Body
    ctx.fillStyle = '#fde047'
    ctx.beginPath(); ctx.arc(15, 15, 15, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke()

    // Eye
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(22, 10, 5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#000'
    ctx.beginPath(); ctx.arc(24, 10, 2, 0, Math.PI * 2); ctx.fill()

    // Beak
    ctx.fillStyle = '#fb923c'
    ctx.beginPath(); ctx.moveTo(28, 15); ctx.lineTo(38, 18); ctx.lineTo(28, 21); ctx.closePath(); ctx.fill()

    // Wing
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    if (flap) {
      ctx.moveTo(10, 15); ctx.lineTo(0, 5); ctx.lineTo(-5, 15);
    } else {
      ctx.moveTo(10, 15); ctx.lineTo(0, 25); ctx.lineTo(-5, 15);
    }
    ctx.closePath(); ctx.fill()
    ctx.stroke()

    ctx.restore()
  }, [])

  useEffect(() => {
    const loop = () => { update(); draw(); frameId.current = requestAnimationFrame(loop) }
    frameId.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId.current)
  }, [update, draw])

  useEffect(() => {
    if (score > highScore) { setHighScore(score); localStorage.setItem('neuroflap-highscore', score.toString()) }
  }, [score, highScore])

  return (
    <div className="game-page" style={{ paddingTop: '100px', minHeight: '100vh', background: 'var(--bg-primary)', cursor: 'crosshair' }}>
      <div className="container">
        <div className="game-header">
          <div className="game-info">
            <h1>Neuro-Flap Challenge</h1>
            <p><strong>Grip Intensity = LIFT.</strong> Squeeze to fly up, release to fall.</p>
          </div>
          <div className="game-scores">
            <div className="score-box">SCORE: {score}</div>
            <div className="score-box highlight">BEST: {highScore}</div>
          </div>
        </div>

        <div className="game-layout">
          <div className="canvas-wrapper card">
            <canvas ref={canvasRef} width="800" height="600" />
            
            {!gameStarted && !gameOver && (
              <div className="game-overlay">
                <div className="start-prompt">
                  <h2>READY?</h2>
                  <p>Hold a squeeze to hover.<br/>Release to drop!</p>
                  <button className="btn btn-primary cursor-target" onClick={() => { resetGame(); setGameStarted(true); }}>
                    START MISSION
                  </button>
                </div>
              </div>
            )}

            {gameOver && (
              <div className="game-overlay restart">
                <h2 style={{ color: 'var(--accent-red)' }}>CRASHED!</h2>
                <p>Score: {score}</p>
                <button className="btn btn-primary cursor-target" onClick={resetGame}>RETRY</button>
                <button className="btn btn-secondary cursor-target" onClick={() => navigate('/exercises')}>QUIT</button>
              </div>
            )}
          </div>

          <div className="game-controller card">
            <div className="emulator-tab">
              <h4>🕹️ PHYSICS ACTIVE</h4>
              <p>The bird falls naturally. You must <strong>squeeze</strong> (move mouse down) to provide lift.</p>
            </div>

            <div className="controller-header">
              <h3>Live Hand Preview</h3>
              <span className="live-badge">SYNCED</span>
            </div>
            
            <div className="game-hand-preview">
              <HandSVG flexion={flexion} />
            </div>

            <div className="flex-meter">
              <div className="flex-label">LIFT STRENGTH</div>
              <div className="flex-bar-bg"><div className="flex-bar-fill" style={{ width: `${flexion}%` }}></div></div>
              <div className="flex-value">{Math.round(flexion)}%</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .game-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
        .game-scores { display: flex; gap: 16px; }
        .score-box { background: var(--bg-card); padding: 12px 24px; border: var(--border-thick); border-radius: 8px; font-family: var(--font-mono); font-weight: bold; }
        .score-box.highlight { color: var(--accent-yellow); border-color: var(--accent-yellow); }
        .game-layout { display: grid; grid-template-columns: 1fr 320px; gap: 32px; }
        .canvas-wrapper { position: relative; padding: 0; overflow: hidden; border: var(--border-thick); border-radius: 16px; height: 600px; background: #000; }
        canvas { width: 100%; height: 100%; display: block; }
        .game-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10, 10, 20, 0.9); display: flex; align-items: center; justify-content: center; z-index: 10; }
        .start-prompt { text-align: center; animation: scaleUp 0.3s ease; }
        .start-prompt h2 { font-family: var(--font-pixel); font-size: 4rem; margin-bottom: 10px; color: var(--accent-cyan); }
        .emulator-tab { background: rgba(0, 240, 255, 0.05); border: 1px dashed var(--accent-cyan); padding: 16px; border-radius: 8px; margin-bottom: 12px; }
        .emulator-tab h4 { color: var(--accent-cyan); margin-bottom: 4px; font-size: 0.8rem; }
        .emulator-tab p { font-size: 0.75rem; opacity: 0.8; }
        .game-hand-preview { height: 260px; }
        .flex-meter { margin-top: 10px; }
        .flex-label { font-family: var(--font-pixel-alt); font-size: 0.9rem; margin-bottom: 6px; }
        .flex-bar-bg { width: 100%; height: 10px; background: #1a1a2e; border-radius: 5px; overflow: hidden; }
        .flex-bar-fill { height: 100%; background: var(--accent-cyan); transition: width 0.05s linear; }
        .flex-value { text-align: right; font-family: var(--font-mono); color: var(--accent-cyan); font-size: 0.9rem; margin-top: 4px; }
        @keyframes scaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  )
}
