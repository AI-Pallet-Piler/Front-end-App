'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Package, MapPin, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/bottom-nav'
import { useWarehouseStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

export default function PickingPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  const orders = useWarehouseStore((state) => state.orders)
  const markTaskPicked = useWarehouseStore((state) => state.markTaskPicked)

  const order = orders.find((o) => o.id === orderId)

  useEffect(() => {
    if (!order) {
      router.push('/')
    }
  }, [order, router])

  if (!order) {
    return null
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
        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">
              Pick Tasks ({pendingTasks.length} remaining)
            </h2>
            {pendingTasks.map((task, index) => (
              <Card
                key={task.id}
                className={cn(
                  'border-2 shadow-lg',
                  index === 0 && 'border-accent ring-2 ring-accent/20'
                )}
              >
                <CardContent className="space-y-4 p-6">
                  {/* Task Number & Location */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                          {task.sequence}
                        </div>
                        {index === 0 && (
                          <Badge className="bg-accent text-accent-foreground">
                            Next
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-5 w-5" />
                          <span className="text-sm font-medium">Location</span>
                        </div>
                        <p className="text-4xl font-bold leading-tight text-foreground">
                          {task.location}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-3 rounded-lg bg-muted p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <p className="text-lg font-bold text-foreground">
                          {task.productName}
                        </p>
                        <p className="text-sm font-medium text-muted-foreground">
                          SKU: {task.sku}
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
                        {task.quantity}×
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleMarkPicked(task.id)}
                    size="lg"
                    className="h-16 w-full bg-accent text-lg font-bold text-accent-foreground hover:bg-accent/90"
                  >
                    <CheckCircle2 className="mr-2 h-6 w-6" />
                    Mark as Picked
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Picked Tasks */}
        {pickedTasks.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-lg font-bold text-muted-foreground">
              Completed ({pickedTasks.length})
            </h2>
            {pickedTasks.map((task) => (
              <Card key={task.id} className="border border-border bg-muted/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <CheckCircle2 className="h-8 w-8 shrink-0 text-accent" />
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-foreground">{task.location}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.productName} • {task.quantity}×
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    Picked
                  </Badge>
                </CardContent>
              </Card>
            ))}
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
