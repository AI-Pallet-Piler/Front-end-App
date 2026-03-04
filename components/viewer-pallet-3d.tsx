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
  isPickedAlready?: boolean
  productColor: string
  onClick?: () => void
}

// Generate consistent color from product name
function getColorFromProductName(name: string): string {
  // Simple hash function to get consistent color
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Generate HSL color with good saturation and lightness for visibility
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 70%, 55%)`
}

function Box({ item, isHighlighted = false, isPickedAlready = false, productColor, onClick }: BoxProps) {
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame(() => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial

      if (isHighlighted) {
        // Flashing animation - pulse emissive intensity only
        const time = Date.now() * 0.005
        material.emissiveIntensity = 0.6 + Math.sin(time) * 0.5
      } else {
        material.emissiveIntensity = isPickedAlready ? 0.05 : 0.1
      }
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

  // Color based on product type, with highlight override
  const getColor = () => {
    if (isHighlighted) return '#fbbf24' // Bright yellow/amber for flashing highlighted items
    return productColor // Always use consistent product color
  }

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={onClick}
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={getColor()}
        transparent
        opacity={isPickedAlready ? 0.75 : 0.9}
        emissive={getColor()}
        emissiveIntensity={isHighlighted ? 0.5 : (isPickedAlready ? 0.05 : 0.1)}
        roughness={isPickedAlready ? 0.8 : 0.5}
        metalness={0.2}
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
  highlightedProductName?: string  // Highlight all items with this product name
  pickedProductNames?: string[]    // Product names already picked — shown as placed on pallet
  onItemClick?: (itemId: string) => void
  palletWidth?: number
  palletDepth?: number
}

export default function PalletViewer({
  palletData,
  highlightedItemId,
  highlightedProductName,
  pickedProductNames,
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

  // Create color map for unique product names
  const productColorMap = new Map<string, string>()
  palletData.items.forEach(item => {
    if (!productColorMap.has(item.name)) {
      productColorMap.set(item.name, getColorFromProductName(item.name))
    }
  })

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

        {/* Boxes — steady buildup: only render picked + current items */}
        {palletData.items.map((item) => {
          const isHighlighted = !!(item.id === highlightedItemId ||
            (highlightedProductName && item.name === highlightedProductName))

          const isPicked = pickedProductNames !== undefined
            ? pickedProductNames.includes(item.name)
            : false

          // In buildup mode: hide boxes that haven't been reached yet
          if (pickedProductNames !== undefined && !isPicked && !isHighlighted) {
            return null
          }

          return (
            <Box
              key={item.id}
              item={item}
              isHighlighted={isHighlighted}
              isPickedAlready={isPicked && !isHighlighted}
              productColor={productColorMap.get(item.name) || '#6366f1'}
              onClick={() => onItemClick?.(item.id)}
            />
          )
        })}

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


    </div>
  )
}
