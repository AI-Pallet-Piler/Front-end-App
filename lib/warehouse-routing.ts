/**
 * Warehouse routing – uses the backend navigation API.
 *
 * Instead of an in-browser A* graph, routing is delegated to the
 * backend `/navigation/path/code/{from}/{to}` endpoint which uses
 * Dijkstra over the real corridor network stored in PostGIS.
 *
 * This module exposes helpers consumed by the `WarehouseRouteNavigator`.
 */

import { fetchNavigationPath, type NavigationPath } from '@/lib/api'
import type { MapPoint } from '@/lib/warehouse-nav'

// ── Types ─────────────────────────────────────────────────────

/** A location code that identifies either a real location or a special zone. */
const SPECIAL_LOCATIONS = new Set(['DOCK', 'STAGE'])

export function isSpecialLocation(code: string): boolean {
  return SPECIAL_LOCATIONS.has(code.trim().toUpperCase())
}

// ── Path cache ────────────────────────────────────────────────

const pathCache = new Map<string, NavigationPath>()

function cacheKey(from: string, to: string) {
  return `${from.toUpperCase()}::${to.toUpperCase()}`
}

/**
 * Fetch the navigation path between two **real** location codes.
 * Results are cached in-memory for the duration of the session.
 */
export async function fetchCachedPath(
  fromCode: string,
  toCode: string,
): Promise<NavigationPath | null> {
  const key = cacheKey(fromCode, toCode)
  const cached = pathCache.get(key)
  if (cached) return cached

  try {
    const path = await fetchNavigationPath(fromCode, toCode)
    pathCache.set(key, path)
    return path
  } catch (err) {
    console.warn(`[routing] failed to fetch path ${fromCode} → ${toCode}`, err)
    return null
  }
}

// ── Build a full multi-stop route ─────────────────────────────

export interface RouteSegmentInput {
  locationCode: string
}

/**
 * Build the complete polyline for a chain of location codes by fetching
 * the real path between each consecutive pair from the backend.
 *
 * @param codes  Ordered list of location codes (e.g. ["DOCK", "LOC-001", "STAGE", "LOC-002", "STAGE"])
 * @param toSvg  A function that maps warehouse (x, y) → SVG (x, y)
 * @param locationLookup  A function that resolves a code → SVG point (for special locations / fallback)
 * @returns Polyline of SVG points
 */
export async function buildRealRoute(
  codes: string[],
  toSvg: (x: number, y: number) => MapPoint,
  locationLookup: (code: string) => MapPoint | null,
): Promise<MapPoint[]> {
  if (codes.length === 0) return []
  if (codes.length === 1) {
    const pt = locationLookup(codes[0])
    return pt ? [pt] : []
  }

  const result: MapPoint[] = []

  for (let i = 0; i < codes.length - 1; i++) {
    const fromCode = codes[i]
    const toCode = codes[i + 1]
    const fromSpecial = isSpecialLocation(fromCode)
    const toSpecial = isSpecialLocation(toCode)

    // If both endpoints are real locations → fetch the backend path
    if (!fromSpecial && !toSpecial) {
      const pathData = await fetchCachedPath(fromCode, toCode)
      if (pathData?.geometry?.coordinates?.length) {
        const svgCoords = pathData.geometry.coordinates.map(([x, y]) => toSvg(x, y))
        // Avoid duplicating the junction point between segments
        const startIdx = result.length > 0 ? 1 : 0
        for (let j = startIdx; j < svgCoords.length; j++) {
          result.push(svgCoords[j])
        }
        continue
      }
    }

    // Fallback: straight line via the coordinate lookup
    const fromPt = locationLookup(fromCode)
    const toPt = locationLookup(toCode)
    if (fromPt && result.length === 0) result.push(fromPt)
    if (toPt) result.push(toPt)
  }

  return result
}

