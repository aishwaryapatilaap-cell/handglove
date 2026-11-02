const FINGERS = [[66, 40, 30, 100], [102, 22, 30, 118], [138, 36, 30, 104], [174, 62, 28, 78]] // index..little

/** angles order: [thumb, index, middle, ring, little]; null counts as 0. */
export default function HandDiagram({ angles, size = 240 }: { angles: (number | null)[]; size?: number }) {
  const v = (i: number) => Math.max(0, Math.min(90, angles[i] ?? 0)) / 90
  return (
    <svg viewBox="0 0 230 230" width={size} height={size} role="img" aria-label="Hand diagram showing finger angles">
      <rect x="44" y="120" width="160" height="100" rx="30" fill="#dde5eb" />
      {FINGERS.map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} rx="14" fill="#dde5eb" stroke="#c5d0d9" />
          <rect x={x} y={y + h - h * v(i + 1)} width={w} height={h * v(i + 1)} rx="12" fill="#1d5c73" />
        </g>
      ))}
      <g transform="rotate(-25 29 150)">
        <rect x="14" y="112" width="30" height="76" rx="14" fill="#dde5eb" stroke="#c5d0d9" />
        <rect x="14" y={188 - 76 * v(0)} width="30" height={76 * v(0)} rx="12" fill="#1d5c73" />
      </g>
    </svg>
  )
}
