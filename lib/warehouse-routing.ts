import { MOCK_AISLE_X, MOCK_CROSS_Y, MOCK_WAREHOUSE_VIEWBOX } from '@/components/mock-warehouse-floorplan'

export type MapPoint = { x: number; y: number }

type NodeId = string

type GraphNode = {
  id: NodeId
  x: number
  y: number
  neighbors: NodeId[]
}

type Graph = {
  nodes: Record<NodeId, GraphNode>
}

function nodeId(x: number, y: number) {
  return `${x},${y}`
}

function dist(a: MapPoint, b: MapPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function manhattan(a: MapPoint, b: MapPoint) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function buildMockGraph(): Graph {
  const nodes: Record<NodeId, GraphNode> = {}

  // intersection nodes
  for (const x of MOCK_AISLE_X) {
    for (const y of MOCK_CROSS_Y) {
      const id = nodeId(x, y)
      nodes[id] = { id, x, y, neighbors: [] }
    }
  }

  // connect vertical neighbors per aisle
  for (const x of MOCK_AISLE_X) {
    const ys = [...MOCK_CROSS_Y].sort((a, b) => a - b)
    for (let i = 0; i < ys.length - 1; i++) {
      const a = nodeId(x, ys[i])
      const b = nodeId(x, ys[i + 1])
      nodes[a].neighbors.push(b)
      nodes[b].neighbors.push(a)
    }
  }

  // connect horizontal neighbors per cross-aisle
  for (const y of MOCK_CROSS_Y) {
    const xs = [...MOCK_AISLE_X].sort((a, b) => a - b)
    for (let i = 0; i < xs.length - 1; i++) {
      const a = nodeId(xs[i], y)
      const b = nodeId(xs[i + 1], y)
      nodes[a].neighbors.push(b)
      nodes[b].neighbors.push(a)
    }
  }

  // connect dock/stage access points to nearest cross-aisle
  const dockAccess: MapPoint = { x: 120, y: 510 }
  const stageAccess: MapPoint = { x: 250, y: 510 }
  for (const p of [dockAccess, stageAccess]) {
    const id = nodeId(p.x, p.y)
    if (!nodes[id]) nodes[id] = { id, x: p.x, y: p.y, neighbors: [] }
  }

  return { nodes }
}

const GRAPH = buildMockGraph()

export function nearestGraphNodeId(point: MapPoint): NodeId {
  let bestId: NodeId | null = null
  let best = Number.POSITIVE_INFINITY

  for (const id of Object.keys(GRAPH.nodes)) {
    const n = GRAPH.nodes[id]
    const d = dist(point, n)
    if (d < best) {
      best = d
      bestId = id
    }
  }

  return bestId ?? nodeId(MOCK_AISLE_X[0], MOCK_CROSS_Y[0])
}

export function astarPath(startId: NodeId, goalId: NodeId): MapPoint[] {
  if (startId === goalId) {
    const n = GRAPH.nodes[startId]
    return [{ x: n.x, y: n.y }]
  }

  const open = new Set<NodeId>([startId])
  const cameFrom = new Map<NodeId, NodeId>()
  const gScore = new Map<NodeId, number>([[startId, 0]])
  const fScore = new Map<NodeId, number>([[startId, heuristic(startId, goalId)]])

  function lowestF(): NodeId {
    let bestId = startId
    let bestVal = Number.POSITIVE_INFINITY
    for (const id of open) {
      const v = fScore.get(id) ?? Number.POSITIVE_INFINITY
      if (v < bestVal) {
        bestVal = v
        bestId = id
      }
    }
    return bestId
  }

  while (open.size > 0) {
    const current = lowestF()
    if (current === goalId) return reconstruct(cameFrom, current)

    open.delete(current)
    const currentNode = GRAPH.nodes[current]
    if (!currentNode) continue

    for (const nb of currentNode.neighbors) {
      const nbNode = GRAPH.nodes[nb]
      if (!nbNode) continue

      const tentativeG = (gScore.get(current) ?? Number.POSITIVE_INFINITY) + dist(currentNode, nbNode)
      const prevG = gScore.get(nb) ?? Number.POSITIVE_INFINITY

      if (tentativeG < prevG) {
        cameFrom.set(nb, current)
        gScore.set(nb, tentativeG)
        fScore.set(nb, tentativeG + heuristic(nb, goalId))
        open.add(nb)
      }
    }
  }

  // fallback: no path (shouldn't happen in this mock)
  const a = GRAPH.nodes[startId]
  const b = GRAPH.nodes[goalId]
  return a && b ? [{ x: a.x, y: a.y }, { x: b.x, y: b.y }] : []
}

function heuristic(aId: NodeId, bId: NodeId) {
  const a = GRAPH.nodes[aId]
  const b = GRAPH.nodes[bId]
  if (!a || !b) return 0
  return manhattan(a, b)
}

function reconstruct(cameFrom: Map<NodeId, NodeId>, current: NodeId): MapPoint[] {
  const path: NodeId[] = [current]
  while (cameFrom.has(current)) {
    current = cameFrom.get(current) as NodeId
    path.push(current)
  }
  path.reverse()

  return path
    .map((id) => GRAPH.nodes[id])
    .filter(Boolean)
    .map((n) => ({ x: n.x, y: n.y }))
}

export function clampToViewBox(p: MapPoint): MapPoint {
  return {
    x: Math.max(0, Math.min(MOCK_WAREHOUSE_VIEWBOX.width, p.x)),
    y: Math.max(0, Math.min(MOCK_WAREHOUSE_VIEWBOX.height, p.y)),
  }
}

export function routeBetweenPoints(start: MapPoint, end: MapPoint): MapPoint[] {
  const s = clampToViewBox(start)
  const e = clampToViewBox(end)

  const startNode = nearestGraphNodeId(s)
  const endNode = nearestGraphNodeId(e)

  const core = astarPath(startNode, endNode)

  // include real endpoints for nicer UX
  const points: MapPoint[] = [s]

  for (const p of core) {
    const last = points[points.length - 1]
    if (!last || last.x !== p.x || last.y !== p.y) points.push(p)
  }

  const last = points[points.length - 1]
  if (!last || last.x !== e.x || last.y !== e.y) points.push(e)

  return points
}

export function polylineLength(points: MapPoint[]) {
  let sum = 0
  for (let i = 0; i < points.length - 1; i++) {
    sum += dist(points[i], points[i + 1])
  }
  return sum
}
