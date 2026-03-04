'use client'

import { cn } from '@/lib/utils'
import type { WarehouseMapData } from '@/lib/api'
import {
  WAREHOUSE_VIEWBOX,
  computeBounds,
  createCoordTransform,
  type WarehouseBounds,
  type MapPoint,
} from '@/lib/warehouse-nav'

// Re-export the viewBox so existing consumers still work.
export const MOCK_WAREHOUSE_VIEWBOX = WAREHOUSE_VIEWBOX

type Props = {
  className?: string
  children?: React.ReactNode
  /** Real warehouse map data (corridors + shelves). When undefined the empty
   *  floor grid is rendered as a placeholder. */
  mapData?: WarehouseMapData | null
}

export function MockWarehouseFloorplan({ className, children, mapData }: Props) {
  const { width, height } = WAREHOUSE_VIEWBOX
  const inset = 28
  const floorX = inset
  const floorY = inset
  const floorW = width - inset * 2
  const floorH = height - inset * 2

  // Compute coordinate transform from the real data (if available)
  const bounds: WarehouseBounds | null = mapData ? computeBounds(mapData) : null
  const transform = bounds ? createCoordTransform(bounds) : null

  return (
    <svg
      className={cn('h-full w-full', className)}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Warehouse floorplan"
    >
      <defs>
        <pattern id="floor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.25" />
        </pattern>
        <pattern id="floor-grid-fine" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.12" />
        </pattern>
      </defs>

      {/* Background + floor grid */}
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

      {/* ─── Real warehouse geometry ─── */}
      {mapData && transform && bounds ? (
        <g>
          {/* Corridors rendered as thick semi-transparent lines */}
          <g opacity={0.55}>
            {mapData.corridors.map((c) => {
              if (!c.geometry?.coordinates) return null
              const coords = c.geometry.coordinates as number[][]
              if (coords.length < 2) return null
              const pts = coords.map(([x, y]) => transform.toSvg(x, y))
              const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
              return (
                <path
                  key={`corr-${c.corridor_id}`}
                  d={d}
                  fill="none"
                  stroke="var(--card)"
                  strokeWidth={Math.max(transform.scale * 1.5, 18)}
                  strokeLinecap="round"
                  opacity={0.7}
                />
              )
            })}
          </g>

          {/* Shelves rendered as filled rectangles */}
          <g fill="var(--muted)" opacity={0.50} stroke="var(--border)" strokeWidth={1}>
            {mapData.shelves.map((s) => {
              if (!s.geometry?.coordinates) return null
              const ring = (s.geometry.coordinates as number[][][])[0]
              if (!ring || ring.length < 4) return null
              const pts = ring.map(([x, y]) => transform.toSvg(x, y))
              const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'
              return <path key={`shelf-${s.shelf_id}`} d={d} rx={4} />
            })}
          </g>

          {/* Shelf labels */}
          <g fill="var(--muted-foreground)" fontSize={9} fontWeight={500} opacity={0.7}>
            {mapData.shelves.map((s) => {
              if (!s.geometry?.coordinates) return null
              const ring = (s.geometry.coordinates as number[][][])[0]
              if (!ring || ring.length < 4) return null
              // Centroid of the polygon
              const xs = ring.map(([x]) => x)
              const ys = ring.map(([, y]) => y)
              const cx = xs.reduce((a, b) => a + b, 0) / xs.length
              const cy = ys.reduce((a, b) => a + b, 0) / ys.length
              const svgPt = transform.toSvg(cx, cy)
              return (
                <text
                  key={`sl-${s.shelf_id}`}
                  x={svgPt.x}
                  y={svgPt.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {s.name.replace('Shelf ', 'S')}
                </text>
              )
            })}
          </g>

          {/* Dock / staging area indicator at bottom-left */}
          {(() => {
            const dockPt = transform.toSvg(bounds.minX, bounds.minY)
            const stagePt = transform.toSvg(
              bounds.minX + bounds.width * 0.15,
              bounds.minY,
            )
            return (
              <g>
                <rect
                  x={dockPt.x - 30}
                  y={dockPt.y - 10}
                  width={stagePt.x - dockPt.x + 80}
                  height={45}
                  rx={10}
                  fill="var(--muted)"
                  opacity={0.25}
                  stroke="var(--border)"
                />
                <text
                  x={dockPt.x - 10}
                  y={dockPt.y + 16}
                  fill="var(--muted-foreground)"
                  fontSize={13}
                  fontWeight={600}
                >
                  DOCK
                </text>
                <text
                  x={stagePt.x - 10}
                  y={stagePt.y + 16}
                  fill="var(--muted-foreground)"
                  fontSize={13}
                  fontWeight={600}
                >
                  STAGE
                </text>
              </g>
            )
          })()}
        </g>
      ) : (
        /* ─── Fallback: lightweight placeholder when data isn't loaded yet ─── */
        <g opacity={0.3}>
          <text
            x={width / 2}
            y={height / 2}
            fill="var(--muted-foreground)"
            fontSize={18}
            fontWeight={600}
            textAnchor="middle"
          >
            Loading warehouse map…
          </text>
        </g>
      )}

      {/* Overlay layer (routes, markers, etc.) */}
      {children}
    </svg>
  )
}

// Legacy exports kept for backwards-compat with older code that
// imported these constants. With real data they are unused.
export const MOCK_AISLE_X = [120, 250, 380, 510, 640, 770, 900]
export const MOCK_CROSS_Y = [120, 250, 380, 510]

