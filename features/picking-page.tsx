'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Package, MapPin, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { BottomNav } from '@/components/navigation-bottom-bar'
import { WarehouseRouteNavigator, type WarehouseStop } from '@/components/warehouse-route-navigator'
import { type IssueType, useWarehouseStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useToast } from '@/lib/use-toast'

function clampProgress(picked: number, total: number) {
  if (!total || total <= 0) return 0
  const p = Math.round((picked / total) * 100)
  return Math.max(0, Math.min(100, p))
}

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
  const markTaskPicked = useWarehouseStore((state) => state.markTaskPicked)
  const addReport = useWarehouseStore((state) => state.addReport)
  const { toast } = useToast()

  const order = orders.find((o) => o.id === orderId)
  const [palletData, setPalletData] = useState<any>(null)

  const [reportOpen, setReportOpen] = useState(false)
  const [issueType, setIssueType] = useState<IssueType>('missing')
  const [issueMessage, setIssueMessage] = useState('')

  // Load mock pallet data
  useEffect(() => {
    fetch('/mock-pallet-data.json')
      .then((res) => res.json())
      .then((data) => {
        // Get the first pallet from the array
        if (data && data.length > 0) {
          setPalletData(data[0])
        }
      })
      .catch((err) => console.error('Failed to load pallet data:', err))
  }, [])

  if (!order) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border border-border shadow-sm rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center gap-6 p-8 text-center">
            <div className="rounded-full bg-muted p-6">
              <AlertCircle className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">No Active Order</h2>
              <p className="text-base text-muted-foreground">
                Please start an order from the home page to access the picking page.
              </p>
            </div>
            <Button 
              onClick={() => router.push('/')} 
              size="lg"
              className="w-full h-12 rounded-xl"
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
  const progress = clampProgress(order.pickedItems, order.totalItems)

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

  const palletItems = Array.isArray(palletData?.items) ? (palletData.items as any[]) : []
  const tasksInSequence = [...order.tasks].sort((a, b) => a.sequence - b.sequence)

  const navigationStops: WarehouseStop[] = tasksInSequence.flatMap((task, idx) => {
    const palletItem = palletItems[Math.min(idx, Math.max(0, palletItems.length - 1))]
    const placementMeta = palletItem
      ? `Place at pallet X ${palletItem.x}cm • Y ${palletItem.y}cm • Z ${palletItem.z}cm`
      : undefined

    const pickStop: WarehouseStop = {
      id: `pick-${task.id}`,
      kind: 'pick',
      location: task.location,
      label: `Go to ${task.location}`,
      meta: `Pick ${task.quantity} • SKU ${task.sku}`,
    }

    const placeStop: WarehouseStop = {
      id: `place-${task.id}`,
      kind: 'place',
      location: 'STAGE',
      label: 'Bring to pallet staging',
      meta: placementMeta,
    }

    return [pickStop, placeStop]
  })

  const currentLocation = pickedTasks
    .slice()
    .sort((a, b) => b.sequence - a.sequence)[0]?.location ?? 'DOCK'

  const submitReport = () => {
    const message = issueMessage.trim()
    if (!message) {
      toast({
        title: 'Add details',
        description: 'Please enter what went wrong before submitting.',
      })
      return
    }

    addReport({
      orderId,
      orderNumber: order.orderNumber,
      taskId: currentTask?.id,
      taskLocation: currentTask?.location,
      taskSku: currentTask?.sku,
      type: issueType,
      message,
    })

    setIssueMessage('')
    setIssueType('missing')
    setReportOpen(false)

    toast({
      title: 'Report submitted',
      description: 'Thanks — your report has been saved.',
    })
  }

  return (
    <div className="min-h-dvh bg-background pb-36">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-foreground">
                {order.orderNumber}
              </h1>
              <p className="truncate text-sm text-muted-foreground">{order.customer}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setReportOpen(true)}
              >
                <AlertCircle className="h-4 w-4" />
                Create report
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {order.pickedItems}/{order.totalItems} items picked
              </span>
              <span className="font-semibold text-foreground">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create report</DialogTitle>
            <DialogDescription>
              Use this if something is wrong while picking.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 space-y-5">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Issue type</div>
              <ToggleGroup
                type="single"
                value={issueType}
                onValueChange={(v) => {
                  if (v) setIssueType(v as IssueType)
                }}
                variant="outline"
                className="w-full"
              >
                <ToggleGroupItem value="missing" className="flex-1">
                  Missing
                </ToggleGroupItem>
                <ToggleGroupItem value="damage" className="flex-1">
                  Damaged
                </ToggleGroupItem>
                <ToggleGroupItem value="blocked" className="flex-1">
                  Blocked
                </ToggleGroupItem>
                <ToggleGroupItem value="other" className="flex-1">
                  Other
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Details</div>
              <textarea
                value={issueMessage}
                onChange={(e) => setIssueMessage(e.target.value)}
                placeholder="Describe what happened…"
                className="min-h-[120px] w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />
              <div className="text-[11px] text-muted-foreground">
                Order {order.orderNumber}
                {currentTask?.location ? ` • Location ${currentTask.location}` : ''}
                {currentTask?.sku ? ` • SKU ${currentTask.sku}` : ''}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setReportOpen(false)}
            >
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={submitReport}>
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content */}
      <main className="px-4 py-5 mx-auto w-full max-w-6xl">
        {/* Two-Column Layout for Current Task */}
        {currentTask && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
            {/* Left Column - Current Item to Pick */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Current Item</h2>
              <Card className="rounded-2xl border border-primary/30 bg-primary/5 shadow-sm">
                <CardContent className="space-y-4 p-5">
                  {/* Task Number & Location */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                          {currentTask.sequence}
                        </div>
                        <Badge variant="secondary" className="rounded-full">
                          Active
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>Location</span>
                        </div>
                        <p className="text-3xl font-semibold leading-tight text-foreground">
                          {currentTask.location}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-3 rounded-xl bg-muted/40 p-4 border border-border/60">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <p className="text-base font-semibold text-foreground">
                          {currentTask.productName}
                        </p>
                        <p className="text-sm font-medium text-muted-foreground">
                          SKU: {currentTask.sku}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-background p-4 border border-border/60">
                      <span className="text-xs font-medium text-muted-foreground">
                        Quantity
                      </span>
                      <span className="text-2xl font-semibold text-foreground">
                        {currentTask.quantity}
                      </span>
                    </div>
                  </div>

                    {/* Google-maps-like navigation (mock) */}
                    <WarehouseRouteNavigator
                      currentLocation={currentLocation}
                      stops={navigationStops}
                      activeStopId={currentTask ? `pick-${currentTask.id}` : null}
                    />

                  {/* Action Button */}
                  <Button
                    onClick={() => handleMarkPicked(currentTask.id)}
                    size="lg"
                    className="h-12 w-full rounded-xl"
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Mark as Picked
                  </Button>
                </CardContent>
              </Card>

              {/* Remaining Tasks Counter */}
              {pendingTasks.length > 1 && (
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground">
                    {pendingTasks.length - 1} more {pendingTasks.length - 1 === 1 ? 'item' : 'items'} remaining
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - 3D Pallet Visualization */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Pallet Visualization</h2>
              <Card className="rounded-2xl border border-border shadow-sm">
                <CardContent className="p-0">
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
                    <PalletViewer
                      palletData={palletData}
                      highlightedItemId={currentTask?.id}
                      onItemClick={(itemId) => console.log('Clicked item:', itemId)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* No Current Task - All Picked */}
        {!currentTask && allPicked && (
          <Card className="rounded-2xl border border-border shadow-sm">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-accent" />
              <h2 className="mt-4 text-xl font-semibold text-foreground">
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
            <h2 className="text-sm font-semibold text-foreground">
              Completed ({pickedTasks.length})
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pickedTasks.map((task) => (
                <Card key={task.id} className="rounded-2xl border border-border bg-muted/30 shadow-sm">
                  <CardContent className="flex items-center gap-4 p-4">
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-accent" />
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{task.location}</p>
                      <p className="text-xs text-muted-foreground truncate">
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
      <div className="fixed bottom-20 left-0 right-0 z-40 border-t border-border bg-background/90 backdrop-blur p-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground">Items remaining</p>
            <p className="text-xl font-semibold text-foreground">{order.totalItems - order.pickedItems}</p>
          </div>

          <Button
            onClick={handleFinishOrder}
            size="lg"
            disabled={!allPicked}
            className={cn('h-12 flex-1 rounded-xl', !allPicked && 'opacity-60')}
          >
            {allPicked ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Finish Order
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-5 w-5" />
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
