'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { MockWarehouseFloorplan, MOCK_WAREHOUSE_VIEWBOX } from '@/components/mock-warehouse-floorplan'
import {
  buildFullRoute,
  locationToGridXY,
  routeSteps,
  type WarehouseGridPoint,
} from '@/lib/warehouse-nav'

export type WarehouseStop = {
  id: string
  kind: 'pick' | 'place'
  location: string
  label: string
  meta?: string
}

type Props = {
  title?: string
  currentLocation: string
  stops: WarehouseStop[]
  activeStopId?: string | null
  className?: string
}

function dotColor(kind: WarehouseGridPoint['kind'], active: boolean) {
  if (active) return 'var(--primary)'
  if (kind === 'start') return 'var(--muted-foreground)'
  if (kind === 'place') return 'var(--accent)'
  return 'var(--primary)'
}

export function WarehouseRouteNavigator({
  title = 'Navigation',
  currentLocation,
  stops,
  activeStopId,
  className,
}: Props) {
  const activeIndex = useMemo(() => {
    if (!activeStopId) return 0
    const idx = stops.findIndex((s) => s.id === activeStopId)
    return idx >= 0 ? idx : 0
  }, [activeStopId, stops])

  const visibleStops = useMemo(() => {
    if (stops.length === 0) return [] as WarehouseStop[]
    return stops.slice(activeIndex, Math.min(stops.length, activeIndex + 2))
  }, [activeIndex, stops])

  const { points, route, view } = useMemo(() => {
    const startXY = locationToGridXY(currentLocation) ?? { x: 80, y: 535 }

    const stopPoints: WarehouseGridPoint[] = visibleStops
      .map((s, idx) => {
        const baseXY = locationToGridXY(s.location)
        if (!baseXY) return null

        // Give each PLACE stop a unique nearby offset (mock),
        // so repeated STAGE placements don’t overlap visually.
        let x = baseXY.x
        let y = baseXY.y
        if (s.kind === 'place') {
          const ox = (idx % 3) - 1
          const oy = Math.floor((idx % 9) / 3) - 1
          x = baseXY.x + ox
          y = baseXY.y + oy
        }

        return {
          x,
          y,
          label: s.label,
          kind: s.kind,
          meta: s.meta,
        } satisfies WarehouseGridPoint
      })
      .filter(Boolean) as WarehouseGridPoint[]

    const all = [{ x: startXY.x, y: startXY.y }, ...stopPoints.map((p) => ({ x: p.x, y: p.y }))]
    const fullRoute = buildFullRoute(all)

    return {
      points: {
        start: { x: startXY.x, y: startXY.y, label: 'You', kind: 'start' as const },
        stops: stopPoints.map((p, i) => ({
          x: p.x,
          y: p.y,
          label: p.label,
          kind: p.kind,
          meta: p.meta,
          id: visibleStops[i]?.id,
        })),
      },
      route: fullRoute,
      view: { cols: MOCK_WAREHOUSE_VIEWBOX.width, rows: MOCK_WAREHOUSE_VIEWBOX.height },
    }
  }, [currentLocation, visibleStops])

  const viewBoxW = view.cols
  const viewBoxH = view.rows

  const polyline = route.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <Card className={cn('rounded-2xl border bg-card shadow-sm', className)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">{title}</div>
            <div className="text-xs text-muted-foreground">
              Step {Math.min(activeIndex + 1, stops.length)} of {stops.length} • ~{routeSteps(route)} steps
            </div>
          </div>
          <Badge variant="secondary" className="rounded-full">
            Mock map
          </Badge>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border bg-muted/10">
          <div className="aspect-[5/3] w-full">
            <MockWarehouseFloorplan className="pointer-events-none">
              <g>
                {polyline.length > 0 && (
                  <polyline
                    points={polyline}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.25"
                  />
                )}
                {polyline.length > 0 && (
                  <polyline
                    points={polyline}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.95"
                  />
                )}

                {/* Start */}
                <circle cx={points.start.x} cy={points.start.y} r="7" fill={dotColor('start', false)} />
                <circle cx={points.start.x} cy={points.start.y} r="3" fill="var(--background)" opacity="0.9" />

                {/* Stops */}
                {points.stops.map((s) => {
                  const isActive = Boolean(activeStopId && s.id === activeStopId)
                  return (
                    <g key={`${s.id}-${s.x}-${s.y}`}>
                      <circle
                        cx={s.x}
                        cy={s.y}
                        r={isActive ? 9 : 8}
                        fill={dotColor(s.kind, isActive)}
                        opacity={isActive ? 1 : 0.92}
                      />
                      <circle cx={s.x} cy={s.y} r={3} fill="var(--background)" opacity="0.92" />
                    </g>
                  )
                })}
              </g>
            </MockWarehouseFloorplan>
          </div>
        </div>

        <div className="space-y-2">
          {visibleStops.map((s, idx) => {
            const active = Boolean(activeStopId && s.id === activeStopId) || (!activeStopId && idx === 0)
            return (
              <div
                key={s.id}
                className={cn(
                  'rounded-xl border border-border bg-background p-3',
                  active && 'border-primary/40 bg-primary/5',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">
                      {activeIndex + idx + 1}. {s.label}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{s.location}</div>
                  </div>
                  <Badge
                    variant={s.kind === 'place' ? 'secondary' : 'default'}
                    className="rounded-full"
                  >
                    {s.kind === 'place' ? 'Place' : 'Pick'}
                  </Badge>
                </div>
                {s.meta ? (
                  <div className="mt-2 text-xs text-muted-foreground">{s.meta}</div>
                ) : null}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
