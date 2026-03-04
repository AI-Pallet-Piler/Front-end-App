'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { MockWarehouseFloorplan } from '@/components/mock-warehouse-floorplan'
import {
  computeBounds,
  createCoordTransform,
  locationToSvgXY,
  routeSteps,
  WAREHOUSE_VIEWBOX,
  type MapPoint,
  type WarehouseGridPoint,
} from '@/lib/warehouse-nav'
import { buildRealRoute } from '@/lib/warehouse-routing'
import {
  fetchWarehouseMap,
  fetchNavigationLocations,
  type WarehouseMapData,
  type WarehouseLocation,
} from '@/lib/api'

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

// ── shared singleton cache so we only hit the API once ────────

let _mapPromise: Promise<WarehouseMapData> | null = null
let _locsPromise: Promise<WarehouseLocation[]> | null = null

function getMapData(): Promise<WarehouseMapData> {
  if (!_mapPromise) {
    _mapPromise = fetchWarehouseMap().catch((err) => {
      _mapPromise = null
      throw err
    })
  }
  return _mapPromise
}

function getLocations(): Promise<WarehouseLocation[]> {
  if (!_locsPromise) {
    _locsPromise = fetchNavigationLocations()
      .then((res) => res.locations)
      .catch((err) => {
        _locsPromise = null
        throw err
      })
  }
  return _locsPromise
}

// ── dot colour helper ─────────────────────────────────────────

function dotColor(kind: WarehouseGridPoint['kind'], active: boolean) {
  if (active) return 'var(--primary)'
  if (kind === 'start') return '#22c55e'
  if (kind === 'place') return 'var(--accent)'
  return 'var(--primary)'
}

// ── component ─────────────────────────────────────────────────

export function WarehouseRouteNavigator({
  title = 'Navigation',
  currentLocation,
  stops,
  activeStopId,
  className,
}: Props) {
  // ── warehouse data (fetched once) ────────────────────────────
  const [mapData, setMapData] = useState<WarehouseMapData | null>(null)
  const [locations, setLocations] = useState<WarehouseLocation[]>([])
  const [dataReady, setDataReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([getMapData(), getLocations()])
      .then(([map, locs]) => {
        if (cancelled) return
        setMapData(map)
        setLocations(locs)
        setDataReady(true)
      })
      .catch((err) => {
        console.error('[WarehouseRouteNavigator] failed to load map data', err)
        if (!cancelled) setDataReady(true) // still render – just without real map
      })
    return () => { cancelled = true }
  }, [])

  // ── visible stops window ──────────────────────────────────────
  const activeIndex = useMemo(() => {
    if (!activeStopId) return 0
    const idx = stops.findIndex((s) => s.id === activeStopId)
    return idx >= 0 ? idx : 0
  }, [activeStopId, stops])

  const visibleStops = useMemo(() => {
    if (stops.length === 0) return [] as WarehouseStop[]
    return stops.slice(activeIndex, Math.min(stops.length, activeIndex + 1))
  }, [activeIndex, stops])

  // ── coordinate transform ──────────────────────────────────────
  const { bounds, toSvg } = useMemo(() => {
    if (!mapData) return { bounds: null, toSvg: null }
    const b = computeBounds(mapData)
    const t = createCoordTransform(b)
    return { bounds: b, toSvg: t.toSvg }
  }, [mapData])

  // ── resolve stop points to SVG coords ─────────────────────────
  const pointsData = useMemo(() => {
    if (!toSvg || !bounds) return null

    const lookup = (code: string) => locationToSvgXY(code, locations, toSvg, bounds)

    const startXY = lookup(currentLocation) ?? { x: 80, y: WAREHOUSE_VIEWBOX.height - 65 }

    const stopPoints = visibleStops
      .map((s) => {
        const base = lookup(s.location)
        if (!base) return null
        return {
          x: base.x,
          y: base.y,
          label: s.label,
          kind: s.kind,
          meta: s.meta,
        } satisfies WarehouseGridPoint
      })
      .filter(Boolean) as WarehouseGridPoint[]

    return {
      start: { x: startXY.x, y: startXY.y, label: 'You', kind: 'start' as const },
      stops: stopPoints.map((p, i) => ({ ...p, id: visibleStops[i]?.id })),
      codes: [currentLocation, ...visibleStops.map((s) => s.location)],
    }
  }, [currentLocation, visibleStops, toSvg, bounds, locations])

  // ── fetch navigation route (async) ────────────────────────────
  const [route, setRoute] = useState<MapPoint[]>([])
  const routeSeqRef = useRef(0) // prevent stale updates

  useEffect(() => {
    if (!pointsData || !toSvg || !bounds) {
      setRoute([])
      return
    }

    const seq = ++routeSeqRef.current
    const lookup = (code: string) => locationToSvgXY(code, locations, toSvg, bounds)

    buildRealRoute(pointsData.codes, toSvg, lookup).then((r) => {
      if (seq === routeSeqRef.current) setRoute(r)
    })
  }, [pointsData, toSvg, bounds, locations])

  // ── render ────────────────────────────────────────────────────
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
            {dataReady && mapData ? 'Live map' : 'Loading…'}
          </Badge>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border bg-muted/10">
          <div className="aspect-[5/3] w-full">
            <MockWarehouseFloorplan className="pointer-events-none" mapData={mapData}>
              <g>
                {/* Route polyline – glow + crisp */}
                {polyline.length > 0 && (
                  <>
                    <polyline
                      points={polyline}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.25"
                    />
                    <polyline
                      points={polyline}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.95"
                    />
                  </>
                )}

                {/* Start dot + label */}
                {pointsData && (
                  <>
                    <circle cx={pointsData.start.x} cy={pointsData.start.y} r="9" fill={dotColor('start', false)} opacity="0.2" />
                    <circle cx={pointsData.start.x} cy={pointsData.start.y} r="7" fill={dotColor('start', false)} />
                    <circle cx={pointsData.start.x} cy={pointsData.start.y} r="3" fill="var(--background)" opacity="0.9" />
                    <text
                      x={pointsData.start.x}
                      y={pointsData.start.y - 13}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="700"
                      fill="#22c55e"
                      stroke="var(--background)"
                      strokeWidth="3"
                      paintOrder="stroke"
                    >
                      START
                    </text>
                  </>
                )}

                {/* Stop dots */}
                {pointsData?.stops.map((s) => {
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

        {/* Stop list */}
        <div className="space-y-2">
          {/* Origin / start point */}
          <div className="rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">Start</div>
                <div className="text-xs text-muted-foreground truncate">{currentLocation}</div>
              </div>
              <Badge
                variant="outline"
                className="rounded-full border-green-500/50 text-green-600 dark:text-green-400"
              >
                Origin
              </Badge>
            </div>
          </div>

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
