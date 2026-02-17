export type WarehouseGridPoint = {
  x: number
  y: number
  label: string
  kind: 'start' | 'pick' | 'place'
  meta?: string
}

export type MapPoint = { x: number; y: number }

export type LocationParts = {
  zone: string
  aisle: number
  bay: number
  level: number
}

const ZONES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export function parseLocationCode(raw: string): LocationParts | null {
  const value = raw.trim()
  const match = /^([A-Za-z])-(\d{1,2})-(\d{1,2})-(\d{1,2})$/.exec(value)
  if (!match) return null

  const zone = match[1].toUpperCase()
  const aisle = Number(match[2])
  const bay = Number(match[3])
  const level = Number(match[4])

  if (!Number.isFinite(aisle) || !Number.isFinite(bay) || !Number.isFinite(level)) return null
  if (aisle <= 0 || bay <= 0 || level <= 0) return null

  return { zone, aisle, bay, level }
}

export function zoneIndex(zone: string) {
  const idx = ZONES.indexOf(zone.toUpperCase())
  return idx >= 0 ? idx : 0
}

export function locationToGridXY(location: string): { x: number; y: number } | null {
  const key = location.trim().toUpperCase()

  // Special mock points.
  // These map to the dock/stage area on the floorplan.
  if (key === 'DOCK') return { x: 80, y: 535 }
  if (key === 'STAGE') return { x: 205, y: 535 }

  const parts = parseLocationCode(location)
  if (!parts) return null

  // Floorplan model (mock, forklift-friendly):
  // - We snap locations to drive aisles so routes never cross through rack blocks.
  // - Aisle number scales left→right across the building.
  // - Zone/bay scales top→bottom.
  const AISLE_X = [120, 250, 380, 510, 640, 770, 900]

  const t = clamp((parts.aisle - 1) / 19, 0, 1)
  const xRaw = 120 + t * (900 - 120)
  const x = nearest(xRaw, AISLE_X)

  const zoneTop = 70
  const zoneHeight = 55
  const yBase = zoneTop + zoneIndex(parts.zone) * zoneHeight
  const y = clamp(yBase + (clamp(parts.bay, 1, 20) - 1) * 2.2, 60, 500)

  return { x, y }
}

function nearest(value: number, options: number[]) {
  let best = options[0] ?? value
  let bestD = Number.POSITIVE_INFINITY
  for (const o of options) {
    const d = Math.abs(value - o)
    if (d < bestD) {
      bestD = d
      best = o
    }
  }
  return best
}

import { polylineLength, routeBetweenPoints } from '@/lib/warehouse-routing'

export function buildFullRoute(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return [] as Array<{ x: number; y: number }>
  if (points.length === 1) return [points[0]]

  const result: Array<{ x: number; y: number }> = [points[0]]
  for (let i = 0; i < points.length - 1; i++) {
    const segment = routeBetweenPoints(points[i], points[i + 1])
    for (let j = 1; j < segment.length; j++) result.push(segment[j])
  }

  return result
}

export function routeSteps(route: Array<{ x: number; y: number }>) {
  // Approximate distance indicator for the UI.
  // Scale is arbitrary in this mock; treat 20 units ~ 1 step.
  const len = polylineLength(route)
  return Math.max(0, Math.round(len / 20))
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}
