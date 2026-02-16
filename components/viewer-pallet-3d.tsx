'use client'

import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Grid, Text } from '@react-three/drei'
import * as THREE from 'three'

interface PalletItem {
  id: string
  name: string
  x: number
  y: number
  z: number
  w: number
  h: number
  d: number
  weight: number
  tipped: boolean
}

interface PalletData {
  pallet_id: number
  items: PalletItem[]
}

interface BoxProps {
  item: PalletItem
  isHighlighted?: boolean
  onClick?: () => void
}

function Box({ item, isHighlighted = false, onClick }: BoxProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame(() => {
    if (meshRef.current && isHighlighted) {
      // Gentle pulsing animation for highlighted box
      const scale = 1 + Math.sin(Date.now() * 0.003) * 0.05
      meshRef.current.scale.set(scale, scale, scale)
    } else if (meshRef.current) {
      meshRef.current.scale.set(1, 1, 1)
    }
  })

  // Convert coordinates: algorithm uses corner position, Three.js uses center
  // Also convert cm to a more reasonable scale (divide by 10 for better viewing)
  const scale = 0.01 // 1cm = 0.01 units
  const position: [number, number, number] = [
    (item.x + item.w / 2) * scale,
    (item.z + item.h / 2) * scale,
    (item.y + item.d / 2) * scale,
  ]

  const size: [number, number, number] = [
    item.w * scale,
    item.h * scale,
    item.d * scale,
  ]

  // Color based on weight and tipping
  const getColor = () => {
    if (isHighlighted) return '#22c55e' // Green for highlighted
    if (hovered) return '#3b82f6' // Blue for hover
    if (item.tipped) return '#f59e0b' // Orange for tipped items
    if (item.weight > 50) return '#dc2626' // Red for heavy items
    if (item.weight > 30) return '#ea580c' // Orange-red for medium-heavy
    return '#6366f1' // Default purple
  }

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={getColor()}
        transparent
        opacity={hovered || isHighlighted ? 0.9 : 0.7}
        emissive={getColor()}
        emissiveIntensity={hovered || isHighlighted ? 0.3 : 0.1}
      />
      {/* Wireframe outline */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial color="#000000" linewidth={1} />
      </lineSegments>
    </mesh>
  )
}

interface PalletBaseProps {
  width: number
  depth: number
}

function PalletBase({ width, depth }: PalletBaseProps) {
  const scale = 0.01
  const palletHeight = 0.05 // 5cm pallet base

  return (
    <group>
      {/* Pallet base */}
      <mesh position={[width * scale / 2, -palletHeight / 2, depth * scale / 2]}>
        <boxGeometry args={[width * scale, palletHeight, depth * scale]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      
      {/* Grid lines on pallet */}
      <Grid
        args={[width * scale, depth * scale]}
        position={[width * scale / 2, 0, depth * scale / 2]}
        rotation={[0, 0, 0]}
        cellSize={0.1}
        cellThickness={0.5}
        cellColor="#ffffff"
        sectionSize={0.5}
        sectionThickness={1}
        sectionColor="#cccccc"
        fadeDistance={50}
        fadeStrength={1}
        infiniteGrid={false}
      />
    </group>
  )
}

export interface PalletViewerProps {
  palletData: PalletData | null
  highlightedItemId?: string
  onItemClick?: (itemId: string) => void
  palletWidth?: number
  palletDepth?: number
}

export default function PalletViewer({
  palletData,
  highlightedItemId,
  onItemClick,
  palletWidth = 80, // Euro pallet: 80cm
  palletDepth = 120, // Euro pallet: 120cm
}: PalletViewerProps) {
  if (!palletData) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <p className="text-muted-foreground">No pallet data available</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <Canvas shadows>
        {/* Camera */}
        <PerspectiveCamera makeDefault position={[2, 2, 2]} fov={50} />
        
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} />

        {/* Pallet Base */}
        <PalletBase width={palletWidth} depth={palletDepth} />

        {/* Boxes */}
        {palletData.items.map((item) => (
          <Box
            key={item.id}
            item={item}
            isHighlighted={item.id === highlightedItemId}
            onClick={() => onItemClick?.(item.id)}
          />
        ))}

        {/* Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={10}
          target={[palletWidth * 0.005, 0.2, palletDepth * 0.005]}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />

        {/* Background */}
        <color attach="background" args={['#f0f0f0']} />
      </Canvas>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 rounded-lg bg-background/90 p-3 text-xs shadow-lg backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-red-600" />
            <span>Heavy (&gt;50kg)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-orange-500" />
            <span>Tipped items</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-indigo-500" />
            <span>Standard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-green-500" />
            <span>Current item</span>
          </div>
        </div>
      </div>

      {/* Controls Info */}
      <div className="absolute right-4 top-4 rounded-lg bg-background/90 p-3 text-xs shadow-lg backdrop-blur-sm">
        <div className="space-y-1">
          <p className="font-semibold">Controls:</p>
          <p>🖱️ Left drag: Rotate</p>
          <p>🖱️ Right drag: Pan</p>
          <p>🔍 Scroll: Zoom</p>
        </div>
      </div>
    </div>
  )
}
