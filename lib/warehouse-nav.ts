/**
 * Warehouse navigation helpers.
 *
 * Converts warehouse location codes to SVG coordinates and builds
 * navigation routes using the backend navigation API.
 */

import type { WarehouseLocation, WarehouseMapData } from '@/lib/api'

// ── public types ──────────────────────────────────────────────
export type WarehouseGridPoint = {
  x: number
  y: number
  label: string
  kind: 'start' | 'pick' | 'place'
  meta?: string
}

export type MapPoint = { x: number; y: number }

// ── SVG viewBox constants (kept for compatibility) ────────────
export const WAREHOUSE_VIEWBOX = { width: 1000, height: 600 } as const
const PADDING = 50

// ── coordinate scaling ────────────────────────────────────────

/** Bounding box of the real warehouse geometry. */
export interface WarehouseBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

/**
 * Compute the bounding box that encloses every geometry in the map.
 */
export function computeBounds(map: WarehouseMapData): WarehouseBounds {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  function visit(x: number, y: number) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }

  for (const c of map.corridors) {
    if (c.geometry?.coordinates) {
      for (const coord of c.geometry.coordinates as number[][]) {
        visit(coord[0], coord[1])
      }
    }
  }

  for (const s of map.shelves) {
    if (s.geometry?.coordinates) {
      for (const ring of s.geometry.coordinates as number[][][]) {
        for (const coord of ring) {
          visit(coord[0], coord[1])
        }
      }
    }
  }

  // Fallback when no geometry was found (e.g. empty DB)
  if (!isFinite(minX)) {
    minX = 0; minY = 0; maxX = 40; maxY = 30
  }

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

/**
 * Build a transform function that maps warehouse coordinates → SVG coordinates.
 *
 * The real warehouse is scaled uniformly to fit the SVG viewBox with padding,
 * and Y is flipped (SVG Y-down vs math Y-up).
 */
export function createCoordTransform(bounds: WarehouseBounds) {
  const vw = WAREHOUSE_VIEWBOX.width
  const vh = WAREHOUSE_VIEWBOX.height
  const scaleX = (vw - 2 * PADDING) / (bounds.width || 1)
  const scaleY = (vh - 2 * PADDING) / (bounds.height || 1)
  const scale = Math.min(scaleX, scaleY)

  const offsetX = PADDING + ((vw - 2 * PADDING) - bounds.width * scale) / 2
  const offsetY = PADDING + ((vh - 2 * PADDING) - bounds.height * scale) / 2

  /** Map a real (x, y) to SVG coordinates. */
  function toSvg(x: number, y: number): MapPoint {
    return {
      x: offsetX + (x - bounds.minX) * scale,
      // Flip Y so warehouse-bottom maps to SVG-bottom
      y: offsetY + (bounds.maxY - y) * scale,
    }
  }

  return { toSvg, scale }
}

// ── location lookup ───────────────────────────────────────────

/**
 * Resolve a location code to SVG coordinates.
 *
 * For real location codes (e.g. "A-01-01", "B-03-01") the coordinates come
 * from the `locations` list returned by the backend.
 * "DOCK" and "STAGE" are resolved to fixed positions at the bottom-left
 * of the warehouse (kept as fallbacks).
 */
export function locationToSvgXY(
  locationCode: string,
  locations: WarehouseLocation[],
  toSvg: (x: number, y: number) => MapPoint,
  bounds: WarehouseBounds,
): MapPoint | null {
  const code = locationCode.trim().toUpperCase()

  // Special well-known positions (warehouse-space coords)
  if (code === 'DOCK') {
    return toSvg(bounds.minX, bounds.minY)
  }
  if (code === 'STAGE') {
    return toSvg(bounds.minX + bounds.width * 0.15, bounds.minY)
  }

  // Real location lookup
  const loc = locations.find((l) => l.location_code.toUpperCase() === code)
  if (loc && loc.x_coordinate != null && loc.y_coordinate != null) {
    return toSvg(loc.x_coordinate, loc.y_coordinate)
  }

  return null
}

// ── route helpers ─────────────────────────────────────────────

/** Straight-line distance of a polyline in SVG units. */
export function polylineLength(points: MapPoint[]) {
  let sum = 0
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x
    const dy = points[i + 1].y - points[i].y
    sum += Math.hypot(dx, dy)
  }
  return sum
}

/** Approximate "step" count shown in the UI. */
export function routeSteps(route: MapPoint[]) {
  return Math.max(0, Math.round(polylineLength(route) / 20))
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

