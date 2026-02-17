'use client'

import { cn } from '@/lib/utils'

export const MOCK_WAREHOUSE_VIEWBOX = {
  width: 1000,
  height: 600,
} as const

type Props = {
  className?: string
  children?: React.ReactNode
}

const AISLE_X = [120, 250, 380, 510, 640, 770, 900]
const CROSS_Y = [120, 250, 380, 510]

export function MockWarehouseFloorplan({ className, children }: Props) {
  const { width, height } = MOCK_WAREHOUSE_VIEWBOX
  const inset = 28
  const floorX = inset
  const floorY = inset
  const floorW = width - inset * 2
  const floorH = height - inset * 2

  const aisleW = 44
  const crossH = 44

  return (
    <svg
      className={cn('h-full w-full', className)}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Mock warehouse floorplan"
    >
      <defs>
        <pattern id="floor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.25" />
        </pattern>
        <pattern id="floor-grid-fine" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.12" />
        </pattern>
      </defs>

      {/* Background + subtle floor grid */}
      <rect x={0} y={0} width={width} height={height} fill="var(--background)" />
      <rect x={floorX} y={floorY} width={floorW} height={floorH} fill="url(#floor-grid-fine)" opacity={0.35} />
      <rect x={floorX} y={floorY} width={floorW} height={floorH} fill="url(#floor-grid)" opacity={0.25} />

      {/* Outer walls */}
      <rect
        x={20}
        y={20}
        width={width - 40}
        height={height - 40}
        fill="none"
        stroke="var(--border)"
        strokeWidth={3}
        rx={18}
      />

      {/* Drivable aisles (wide corridors) */}
      <g opacity={0.55}>
        {AISLE_X.map((x) => (
          <rect
            key={`aisle-${x}`}
            x={x - aisleW / 2}
            y={60}
            width={aisleW}
            height={height - 220}
            rx={12}
            fill="var(--card)"
          />
        ))}
        {CROSS_Y.map((y) => (
          <rect
            key={`cross-${y}`}
            x={60}
            y={y - crossH / 2}
            width={width - 120}
            height={crossH}
            rx={12}
            fill="var(--card)"
          />
        ))}
      </g>

      {/* Dock / staging area */}
      <rect
        x={30}
        y={height - 120}
        width={260}
        height={90}
        rx={16}
        fill="var(--muted)"
        opacity={0.25}
        stroke="var(--border)"
      />
      <text x={50} y={height - 72} fill="var(--muted-foreground)" fontSize={18} fontWeight={600}>
        DOCK
      </text>
      <text x={160} y={height - 72} fill="var(--muted-foreground)" fontSize={18} fontWeight={600}>
        STAGE
      </text>

      {/* Rack blocks (denser + outlined) */}
      <g fill="var(--muted)" opacity={0.42} stroke="var(--border)" strokeWidth={1}>
        {/* Left rack field */}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={`l-${i}`} x={70} y={70 + i * 55} width={90} height={38} rx={10} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={`l2-${i}`} x={180} y={70 + i * 55} width={90} height={38} rx={10} />
        ))}

        {/* Middle rack fields */}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={`m-${i}`} x={320} y={70 + i * 55} width={120} height={38} rx={10} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={`m2-${i}`} x={460} y={70 + i * 55} width={120} height={38} rx={10} />
        ))}

        {/* Right rack fields */}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={`r-${i}`} x={700} y={70 + i * 55} width={110} height={38} rx={10} />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={`r2-${i}`} x={830} y={70 + i * 55} width={110} height={38} rx={10} />
        ))}
      </g>

      {/* Operational areas (simple mock) */}
      <g>
        {/* Charging / service */}
        <rect
          x={width - 240}
          y={height - 120}
          width={200}
          height={90}
          rx={16}
          fill="var(--muted)"
          opacity={0.18}
          stroke="var(--border)"
        />
        <text
          x={width - 220}
          y={height - 72}
          fill="var(--muted-foreground)"
          fontSize={16}
          fontWeight={600}
        >
          CHARGING
        </text>

        {/* Safety zone near dock (use existing destructive token) */}
        <rect
          x={310}
          y={height - 120}
          width={180}
          height={90}
          rx={16}
          fill="var(--destructive)"
          opacity={0.08}
          stroke="var(--border)"
        />
        <text x={330} y={height - 72} fill="var(--muted-foreground)" fontSize={16} fontWeight={600}>
          SAFETY
        </text>
      </g>

      {/* Aisle labels */}
      <g fill="var(--muted-foreground)" fontSize={12} fontWeight={600} opacity={0.9}>
        {AISLE_X.map((x, i) => (
          <text key={`al-${x}`} x={x - 18} y={48}>
            A{i + 1}
          </text>
        ))}
      </g>

      {/* Cross-aisle labels (zones) */}
      <g fill="var(--muted-foreground)" fontSize={12} fontWeight={600} opacity={0.9}>
        {CROSS_Y.map((y, i) => (
          <text key={`zl-${y}`} x={34} y={y + 4}>
            Z{i + 1}
          </text>
        ))}
      </g>

      {/* Overlay (route, markers, etc.) */}
      {children}
    </svg>
  )
}

export const MOCK_AISLE_X = AISLE_X
export const MOCK_CROSS_Y = CROSS_Y
