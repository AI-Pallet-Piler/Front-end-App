'use client'

import { useRouter } from 'next/navigation'
import { Package, MapPin, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BottomNav } from '@/components/navigation-bottom-bar'
import { useWarehouseStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

export default function HomePage() {
  const router = useRouter()
  const orders = useWarehouseStore((state) => state.orders)
  const isLoading = useWarehouseStore((state) => state.isLoading)
  const error = useWarehouseStore((state) => state.error)
  const setActiveOrder = useWarehouseStore((state) => state.setActiveOrder)
  const loadOrders = useWarehouseStore((state) => state.loadOrders)

  // Load orders on mount
  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeOrders = orders.filter((order) => order.status !== 'completed')

  const handleStartOrder = (orderId: string) => {
    setActiveOrder(orderId)
    router.push(`/picking/${orderId}`)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-primary px-6 py-6 shadow-md">
        <div className="flex items-center gap-3">
          <Package className="h-9 w-9 text-primary-foreground" strokeWidth={2.5} />
          <div>
            <h1 className="text-2xl font-bold leading-tight text-primary-foreground">
              My Picking Tasks
            </h1>
            <p className="text-sm font-medium text-primary-foreground/80">
              {isLoading ? 'Loading...' : `${activeOrders.length} ${activeOrders.length === 1 ? 'order' : 'orders'} assigned`}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        {/* Error State */}
        {error && (
          <Card className="border-2 border-destructive mb-4">
            <CardContent className="flex items-center gap-4 p-6">
              <AlertCircle className="h-8 w-8 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-1">Failed to Load Orders</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={loadOrders} variant="outline">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border-2">
                <CardHeader className="space-y-3 p-6">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-5 w-64" />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-4">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeOrders.length === 0 ? (
          <Card className="border-2 border-dashed border-border">
            <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="rounded-full bg-muted p-6">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">No Tasks Assigned</h3>
                <p className="text-base text-muted-foreground">
                  Check back later for new picking tasks
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => {
              const progress = Math.round((order.pickedItems / order.totalItems) * 100)
              const isInProgress = order.status === 'in-progress'

              return (
                <Card
                  key={order.id}
                  className={cn(
                    'overflow-hidden border-2 shadow-lg transition-all hover:shadow-xl',
                    isInProgress && 'border-accent'
                  )}
                >
                  <CardHeader className="space-y-3 bg-card p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold leading-tight text-foreground">
                            {order.orderNumber}
                          </h2>
                          {isInProgress && (
                            <Badge className="bg-accent text-accent-foreground">
                              In Progress
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-base text-muted-foreground">
                          <MapPin className="h-5 w-5" />
                          <span className="font-medium">{order.customer}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
                        <Package className="h-6 w-6 text-primary" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Total Lines
                          </p>
                          <p className="text-2xl font-bold text-foreground">
                            {order.totalLines}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
                        <CheckCircle2 className="h-6 w-6 text-accent" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Total Items
                          </p>
                          <p className="text-2xl font-bold text-foreground">
                            {order.totalItems}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    {isInProgress && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-foreground">
                            Progress: {order.pickedItems}/{order.totalItems} items
                          </span>
                          <span className="font-bold text-accent">{progress}%</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full bg-accent transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="p-6 pt-4">
                    <Button
                      onClick={() => handleStartOrder(order.id)}
                      size="lg"
                      className="h-16 w-full text-lg font-bold"
                      variant={isInProgress ? 'default' : 'default'}
                    >
                      {isInProgress ? (
                        <>
                          <Clock className="mr-2 h-6 w-6" />
                          Continue Picking
                        </>
                      ) : (
                        <>
                          <Package className="mr-2 h-6 w-6" />
                          Start Picking
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
