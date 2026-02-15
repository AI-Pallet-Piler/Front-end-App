'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Package, MapPin, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/navigation-bottom-bar'
import { useWarehouseStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { fetchPalletInstructions, PalletData } from '@/lib/api'

// Dynamically import PalletViewer to avoid SSR issues with Three.js
const PalletViewer = dynamic(() => import('@/components/viewer-pallet-3d'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <div className="text-center space-y-2">
        <Package className="mx-auto h-16 w-16 animate-pulse text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading 3D view...</p>
      </div>
    </div>
  ),
})

export default function PickingPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  const orders = useWarehouseStore((state) => state.orders)
  const isLoading = useWarehouseStore((state) => state.isLoading)
  const loadOrders = useWarehouseStore((state) => state.loadOrders)
  const markTaskPicked = useWarehouseStore((state) => state.markTaskPicked)

  const order = orders.find((o) => o.id === orderId)
  const [palletData, setPalletData] = useState<PalletData | null>(null)
  const [palletError, setPalletError] = useState<string | null>(null)
  const [loadingPallet, setLoadingPallet] = useState(false)

  // Load orders on mount if not already loaded
  useEffect(() => {
    if (orders.length === 0 && !isLoading) {
      loadOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.length, isLoading])

  // Load pallet instructions from API when order is available
  useEffect(() => {
    if (!order) return

    const loadPalletInstructions = async () => {
      setLoadingPallet(true)
      setPalletError(null)
      
      try {
        // Extract numeric order ID from the order
        const numericOrderId = parseInt(order.id, 10)
        if (isNaN(numericOrderId)) {
          throw new Error('Invalid order ID')
        }

        const palletInstructions = await fetchPalletInstructions(numericOrderId)
        
        // Get the first pallet from the array (for now)
        if (palletInstructions && palletInstructions.length > 0) {
          setPalletData(palletInstructions[0])
        } else {
          setPalletError('No pallet data available')
        }
      } catch (error) {
        console.error('Failed to load pallet instructions:', error)
        setPalletError(error instanceof Error ? error.message : 'Failed to load pallet visualization')
      } finally {
        setLoadingPallet(false)
      }
    }

    loadPalletInstructions()
  }, [order])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center gap-6 p-8 text-center">
            <Package className="h-16 w-16 animate-pulse text-primary" />
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">Loading Order...</h2>
              <p className="text-base text-muted-foreground">
                Please wait while we fetch your order details.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-6 p-8 text-center">
            <div className="rounded-full bg-muted p-6">
              <AlertCircle className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">No Active Order</h2>
              <p className="text-base text-muted-foreground">
                Please start an order from the home page to access the picking page.
              </p>
            </div>
            <Button 
              onClick={() => router.push('/')} 
              size="lg"
              className="w-full h-14 text-lg font-bold"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pendingTasks = order.tasks.filter((t) => t.status === 'pending')
  const pickedTasks = order.tasks.filter((t) => t.status === 'picked')
  const allPicked = pendingTasks.length === 0
  const progress = Math.round((order.pickedItems / order.totalItems) * 100)

  const handleMarkPicked = (taskId: string) => {
    // Vibration feedback
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(200)
    }
    markTaskPicked(orderId, taskId)
  }

  const handleFinishOrder = () => {
    router.push('/')
  }

  const currentTask = pendingTasks[0]

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-primary px-4 py-4 shadow-md">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="h-12 w-12 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="h-7 w-7" strokeWidth={2.5} />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold leading-tight text-primary-foreground">
              {order.orderNumber}
            </h1>
            <p className="text-sm font-medium text-primary-foreground/80">
              {order.customer}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-primary-foreground">
              {order.pickedItems}/{order.totalItems} items picked
            </span>
            <span className="font-bold text-primary-foreground">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-primary-foreground/30">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        {/* Two-Column Layout for Current Task */}
        {currentTask && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[30%_70%]">
            {/* Left Column - Current Item to Pick */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">
                Current Item to Pick
              </h2>
              <Card className="border-2 border-accent shadow-lg ring-2 ring-accent/20">
                <CardContent className="space-y-4 p-6">
                  {/* Task Number & Location */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                          {currentTask.sequence}
                        </div>
                        <Badge className="bg-accent text-accent-foreground">
                          Active
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-5 w-5" />
                          <span className="text-sm font-medium">Location</span>
                        </div>
                        <p className="text-4xl font-bold leading-tight text-foreground">
                          {currentTask.location}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-3 rounded-lg bg-muted p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <p className="text-lg font-bold text-foreground">
                          {currentTask.productName}
                        </p>
                        <p className="text-sm font-medium text-muted-foreground">
                          SKU: {currentTask.sku}
                        </p>
                      </div>
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-background">
                        <Package className="h-8 w-8 text-primary" />
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-3 rounded-lg bg-background p-4">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Quantity
                      </span>
                      <span className="text-4xl font-bold text-foreground">
                        {currentTask.quantity}×
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleMarkPicked(currentTask.id)}
                    size="lg"
                    className="h-16 w-full bg-accent text-lg font-bold text-accent-foreground hover:bg-accent/90"
                  >
                    <CheckCircle2 className="mr-2 h-6 w-6" />
                    Mark as Picked
                  </Button>
                </CardContent>
              </Card>

              {/* Remaining Tasks Counter */}
              {pendingTasks.length > 1 && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    {pendingTasks.length - 1} more {pendingTasks.length - 1 === 1 ? 'item' : 'items'} remaining
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - 3D Pallet Visualization */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">
                Pallet Visualization
              </h2>
              <Card className="border-2 shadow-lg">
                <CardContent className="p-0">
                  <div className="aspect-square w-full rounded-lg overflow-hidden">
                    {loadingPallet ? (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <div className="text-center space-y-2">
                          <Package className="mx-auto h-16 w-16 animate-pulse text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Loading pallet visualization...</p>
                        </div>
                      </div>
                    ) : palletError ? (
                      <div className="flex h-full w-full items-center justify-center bg-muted p-6">
                        <div className="text-center space-y-2">
                          <AlertCircle className="mx-auto h-16 w-16 text-destructive" />
                          <p className="text-sm font-semibold text-foreground">Visualization Not Available</p>
                          <p className="text-xs text-muted-foreground">{palletError}</p>
                        </div>
                      </div>
                    ) : palletData ? (
                      <PalletViewer
                        palletData={palletData}
                        highlightedItemId={currentTask?.id}
                        onItemClick={(itemId) => console.log('Clicked item:', itemId)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <p className="text-sm text-muted-foreground">No pallet data</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* No Current Task - All Picked */}
        {!currentTask && allPicked && (
          <Card className="border-2 border-accent shadow-lg">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-accent" />
              <h2 className="mt-4 text-2xl font-bold text-foreground">
                All Items Picked!
              </h2>
              <p className="mt-2 text-muted-foreground">
                You can now finish this order.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Picked Tasks */}
        {pickedTasks.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-lg font-bold text-muted-foreground">
              Completed ({pickedTasks.length})
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pickedTasks.map((task) => (
                <Card key={task.id} className="border border-border bg-muted/50">
                  <CardContent className="flex items-center gap-4 p-4">
                    <CheckCircle2 className="h-8 w-8 shrink-0 text-accent" />
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{task.location}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {task.productName} • {task.quantity}×
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Sticky Action Bar */}
      <div className="fixed bottom-20 left-0 right-0 z-40 border-t border-border bg-card p-4 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Items Remaining
            </p>
            <p className="text-2xl font-bold text-foreground">
              {order.totalItems - order.pickedItems}
            </p>
          </div>
          <Button
            onClick={handleFinishOrder}
            size="lg"
            disabled={!allPicked}
            className={cn(
              'h-14 flex-1 text-lg font-bold',
              allPicked
                ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                : 'opacity-50'
            )}
          >
            {allPicked ? (
              <>
                <CheckCircle2 className="mr-2 h-6 w-6" />
                Finish Order
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-6 w-6" />
                Complete All Tasks First
              </>
            )}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
