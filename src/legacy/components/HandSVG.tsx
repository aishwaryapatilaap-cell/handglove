import { useState, useEffect, useRef } from 'react'

interface HandSVGProps {
  flexion?: number; // 0 (straight) to 100 (curled)
}

export default function HandSVG({ flexion }: HandSVGProps) {
  const [angles, setAngles] = useState([45, 60, 35, 50, 40])
  const [isHovered, setIsHovered] = useState(false)
  const [activeFinger, setActiveFinger] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use external flexion if provided, otherwise use internal simulation/hover
  useEffect(() => {
    if (flexion !== undefined) {
      // Map 0-100 to 10-90
      const targetAngle = 10 + (flexion / 100) * 80
      setAngles([targetAngle, targetAngle, targetAngle, targetAngle, targetAngle])
      return
    }

    if (isHovered) return
    const interval = setInterval(() => {
      setAngles(prev => prev.map(a => {
        const delta = (Math.random() - 0.5) * 8
        return Math.max(10, Math.min(90, a + delta))
      }))
    }, 150)
    return () => clearInterval(interval)
  }, [isHovered, flexion])

  const fingerPaths = [
    { x: 60, yOff: 45, rot: -30, label: 'Thumb', h1: 50, h2: 40 },
    { x: 125, yOff: 0, rot: 0, label: 'Index', h1: 80, h2: 65 },
    { x: 165, yOff: 0, rot: 0, label: 'Middle', h1: 85, h2: 70 },
    { x: 205, yOff: 0, rot: 0, label: 'Ring', h1: 80, h2: 65 },
    { x: 245, yOff: 0, rot: 0, label: 'Pinky', h1: 70, h2: 60 },
  ]

  const handleMouseMove = (e: React.MouseEvent) => {
    if (flexion !== undefined) return // Disable internal hover if external flexion is provided
    if (!containerRef.current) return
    setIsHovered(true)
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const baseFlexion = (y / rect.height) * 80 + 10

    let closestIdx = -1
    let minDist = Infinity

    const newAngles = angles.map((_, i) => {
      const fingerXPercent = (fingerPaths[i].x / 350)
      const fingerX = fingerXPercent * rect.width
      const dist = Math.abs(x - fingerX)
      
      if (dist < minDist) {
        minDist = dist
        closestIdx = i
      }

      const influence = Math.max(0, 1 - dist / (rect.width * 0.3))
      const target = baseFlexion * (0.7 + influence * 0.6)
      return Math.max(10, Math.min(90, target))
    })

    setAngles(newAngles)
    setActiveFinger(minDist < 40 ? closestIdx : null)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setActiveFinger(null)
  }

  const getColor = (angle: number) => {
    if (angle >= 60) return '#22c55e'
    if (angle >= 40) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div 
      ref={containerRef}
      className="hand-parallax-wrapper"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <svg viewBox="0 0 350 440" fill="none" style={{ width: '100%', height: '100%' }}>
        {/* Palm / Wrist */}
        <path 
          d="M 85 285 Q 85 260 110 260 L 230 260 Q 260 260 265 295 L 275 380 Q 275 415 230 415 L 110 415 Q 75 415 75 380 Z" 
          fill="#141432" 
          stroke="#00f0ff" 
          strokeWidth="1.5" 
          opacity="0.8" 
        />

        {/* Fingers */}
        {fingerPaths.map((finger, i) => {
          const bendOffset = ((angles[i] - 10) / 80) * 45
          const baseY = 260 + finger.yOff
          const color = getColor(angles[i])
          const isActive = activeFinger === i

          return (
            <g key={finger.label} transform={`rotate(${finger.rot}, ${finger.x}, ${baseY})`}>
              {/* Lower segment */}
              <rect
                x={finger.x - 11}
                y={baseY - finger.h1}
                width={22}
                height={finger.h1}
                rx={6}
                fill="#141432"
                stroke={isActive ? 'var(--accent-cyan)' : color}
                strokeWidth={isActive ? 2 : 1.5}
                style={{ transition: 'all 0.2s ease' }}
              />
              
              {/* Upper segment */}
              <rect
                x={finger.x - 9}
                y={baseY - finger.h1 - finger.h2 + 5}
                width={18}
                height={finger.h2}
                rx={5}
                fill="rgba(20,20,50,0.9)"
                stroke={isActive ? 'var(--accent-cyan)' : color}
                strokeWidth={isActive ? 2 : 1.2}
                style={{
                  transition: 'all 0.15s ease-out',
                  transform: `rotate(${bendOffset}deg)`,
                  transformOrigin: `${finger.x}px ${baseY - finger.h1}px`
                }}
              />

              {/* Pop-up Tab */}
              {isActive && (
                <g style={{ animation: 'fadeIn 0.2s ease' }} transform={`rotate(${-finger.rot}, ${finger.x}, ${baseY - finger.h1 - finger.h2})`}>
                  <rect x={finger.x - 30} y={baseY - finger.h1 - finger.h2 - 40} width="60" height="30" rx="6" fill="#1e1e3f" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                  <path d={`M ${finger.x - 5} ${baseY - finger.h1 - finger.h2 - 10} L ${finger.x} ${baseY - finger.h1 - finger.h2} L ${finger.x + 5} ${baseY - finger.h1 - finger.h2 - 10} Z`} fill="#1e1e3f" stroke="var(--accent-cyan)" strokeWidth="1" />
                  <text x={finger.x} y={baseY - finger.h1 - finger.h2 - 20} textAnchor="middle" fill="var(--accent-cyan)" fontSize="12" fontFamily="'JetBrains Mono', monospace" fontWeight="bold">
                    {Math.round(angles[i])}°
                  </text>
                </g>
              )}

              {/* Finger name */}
              <text
                x={finger.x}
                y={baseY + 25}
                textAnchor="middle"
                fill="#6b7280"
                fontSize="6"
                fontFamily="'JetBrains Mono', monospace"
                letterSpacing="0.5"
                transform={`rotate(${-finger.rot}, ${finger.x}, ${baseY + 25})`}
              >
                {finger.label.toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
