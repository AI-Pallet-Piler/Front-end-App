'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2 } from 'lucide-react'

interface SwipeToConfirmProps {
  onConfirm: () => void
  label?: string
  confirmLabel?: string
  className?: string
  disabled?: boolean
  variant?: 'primary' | 'success' | 'warning'
}

export function SwipeToConfirm({
  onConfirm,
  label = 'Swipe to confirm',
  confirmLabel = 'Confirmed!',
  className,
  disabled = false,
  variant = 'primary',
}: SwipeToConfirmProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const thumbRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [position, setPosition] = React.useState(0)
  const [isConfirmed, setIsConfirmed] = React.useState(false)
  const [maxPosition, setMaxPosition] = React.useState(0)

  // Calculate max position on mount and resize
  React.useEffect(() => {
    const updateMaxPosition = () => {
      if (containerRef.current && thumbRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const thumbWidth = thumbRef.current.offsetWidth
        setMaxPosition(containerWidth - thumbWidth - 8) // 8px padding
      }
    }
    updateMaxPosition()
    window.addEventListener('resize', updateMaxPosition)
    return () => window.removeEventListener('resize', updateMaxPosition)
  }, [])

  const getClientX = (e: React.TouchEvent | React.MouseEvent): number => {
    if ('touches' in e) {
      return e.touches[0].clientX
    }
    return e.clientX
  }

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (disabled || isConfirmed) return
    setIsDragging(true)
  }

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || disabled || isConfirmed || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const clientX = getClientX(e)
    const newPosition = Math.max(0, Math.min(clientX - containerRect.left - 28, maxPosition))
    setPosition(newPosition)
  }

  const handleEnd = () => {
    if (!isDragging || disabled || isConfirmed) return
    setIsDragging(false)

    // If dragged more than 85% of the way, confirm
    if (position >= maxPosition * 0.85) {
      setPosition(maxPosition)
      setIsConfirmed(true)
      // Vibration feedback
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
      setTimeout(() => {
        onConfirm()
        // Reset after a short delay
        setTimeout(() => {
          setIsConfirmed(false)
          setPosition(0)
        }, 500)
      }, 200)
    } else {
      // Spring back to start
      setPosition(0)
    }
  }

  const progress = maxPosition > 0 ? (position / maxPosition) * 100 : 0

  const variantStyles = {
    primary: {
      track: 'bg-primary/20',
      fill: 'bg-primary',
      thumb: 'bg-primary text-primary-foreground',
    },
    success: {
      track: 'bg-green-500/20',
      fill: 'bg-green-500',
      thumb: 'bg-green-500 text-white',
    },
    warning: {
      track: 'bg-orange-500/20',
      fill: 'bg-orange-500',
      thumb: 'bg-orange-500 text-white',
    },
  }

  const styles = variantStyles[variant]

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative h-14 w-full overflow-hidden rounded-xl select-none',
        styles.track,
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      {/* Progress fill */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 transition-all duration-75',
          styles.fill,
          isConfirmed && 'duration-200'
        )}
        style={{ width: `${progress + 15}%` }}
      />

      {/* Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className={cn(
            'text-sm font-medium transition-opacity duration-200',
            progress > 50 ? 'text-white' : 'text-foreground',
            isConfirmed && 'opacity-0'
          )}
        >
          {isConfirmed ? confirmLabel : label}
        </span>
      </div>

      {/* Confirmed checkmark */}
      {isConfirmed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <CheckCircle2 className="h-6 w-6 text-white animate-in zoom-in-50 duration-200" />
        </div>
      )}

      {/* Draggable thumb */}
      <div
        ref={thumbRef}
        className={cn(
          'absolute top-1 left-1 h-12 w-14 rounded-lg flex items-center justify-center cursor-grab shadow-md transition-transform',
          styles.thumb,
          isDragging && 'cursor-grabbing scale-105',
          isConfirmed && 'opacity-0'
        )}
        style={{ transform: `translateX(${position}px)` }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>
  )
}
