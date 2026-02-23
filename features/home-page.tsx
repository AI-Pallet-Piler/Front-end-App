'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package,
  CheckCircle2,
  Clock,
  TrendingUp,
  Box,
  Play,
  Info,
  AlertCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BottomNav } from '@/components/navigation-bottom-bar'
import { useWarehouseStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'

function calcProgress(picked: number, total: number) {
  if (!total || total <= 0) return 0
  const p = Math.round((picked / total) * 100)
  return Math.max(0, Math.min(100, p))
}

function estimatePallets(order: any) {
  const explicit = Number(order?.pallets ?? order?.totalPallets)
  if (Number.isFinite(explicit) && explicit > 0) return explicit

  const totalItems = Number(order?.totalItems ?? 0)
  if (totalItems > 0) return Math.max(1, Math.ceil(totalItems / 12))

  const totalLines = Number(order?.totalLines ?? 0)
  if (totalLines > 0) return Math.max(1, Math.ceil(totalLines / 4))

  return 1
}

function DotLegend({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className={cn('h-2 w-2 rounded-full', colorClass)} />
      <span>{label}</span>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <Card className="rounded-2xl border bg-card shadow-sm">
      <CardContent className="flex flex-col items-center justify-center gap-0.5 p-3">
        <div className="text-muted-foreground">{icon}</div>
        <div className="text-lg font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const router = useRouter()
  const orders = useWarehouseStore((state) => state.orders)
  const isLoading = useWarehouseStore((state) => state.isLoading)
  const error = useWarehouseStore((state) => state.error)
  const setActiveOrder = useWarehouseStore((state) => state.setActiveOrder)
  const startOrder = useWarehouseStore((state) => state.startOrder)
  const loadOrders = useWarehouseStore((state) => state.loadOrders)

  // Load orders on mount
  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleStartOrder = async (orderId: string) => {
    try {
      await startOrder(orderId)
      router.push(`/picking/${orderId}`)
    } catch (error) {
      console.error('Failed to start order:', error)
      // Optionally show a toast or error message
    }
  }

  const handleContinueOrder = (orderId: string) => {
    setActiveOrder(orderId)
    router.push(`/picking/${orderId}`)
  }

  // ---- Split orders into sections (based on your status values) ----
  const { inProgress, ready, completed, completedToday } = useMemo(() => {
    const inProgress = orders.filter((o: any) => o.status === 'in-progress')
    const completed = orders.filter((o: any) => o.status === 'completed')
    const ready = orders.filter((o: any) => o.status !== 'completed' && o.status !== 'in-progress')
    
    // Filter completed orders by today's date (null completedAt counts as today — assumed just completed)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const completedToday = completed.filter((o: any) => {
      if (!o.completedAt) return true // no timestamp yet → assume today
      const completedDate = new Date(o.completedAt)
      completedDate.setHours(0, 0, 0, 0)
      return completedDate.getTime() === today.getTime()
    })
    
    return { inProgress, ready, completed, completedToday }
  }, [orders])

  const activeCount = inProgress.length
  const pendingCount = ready.length
  const completedTodayCount = completedToday.length

  // To mimic screenshot: show the first in-progress card (you can render all if you want)
  const mainInProgress = inProgress[0]

  return (
    <div className="min-h-dvh bg-background pb-10">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">My Orders</h1>

          <div className="mt-2 flex items-center gap-4">
            <DotLegend label={`${activeCount} In Progress`} colorClass="bg-primary" />
            <DotLegend label={`${pendingCount} Pending`} colorClass="bg-muted-foreground/30" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4 space-y-6">
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
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Info className="h-4 w-4 text-primary" />}
            value={activeCount}
            label="Active"
          />
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            value={pendingCount}
            label="Pending"
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4 text-accent" />}
            value={completedTodayCount}
            label="Today"
          />
        </div>

        {/* In Progress */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingUp className="h-4 w-4 text-primary" />
            In Progress
          </div>

          {!mainInProgress ? (
            <Card className="rounded-2xl border bg-card">
              <CardContent className="p-4 text-sm text-muted-foreground">
                No order in progress.
              </CardContent>
            </Card>
          ) : (
            <Card
              className="rounded-2xl border-2 border-primary/40 bg-primary/5 shadow-sm cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => handleContinueOrder(mainInProgress.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleContinueOrder(mainInProgress.id)
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <Box className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {mainInProgress.orderNumber ?? mainInProgress.id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {mainInProgress.customer}
                      </div>
                    </div>
                  </div>

                  <Badge className="bg-muted text-foreground">Normal</Badge>
                </div>

                {(() => {
                  const progress = calcProgress(
                    Number(mainInProgress.pickedItems ?? 0),
                    Number(mainInProgress.totalItems ?? 0)
                  )
                  const pallets = estimatePallets(mainInProgress)
                  return (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span className="font-semibold text-primary">{progress}%</span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          <span>{mainInProgress.totalItems} items</span>
                        </div>
                        <span className="text-muted-foreground/30">•</span>
                        <div className="flex items-center gap-1">
                          <Box className="h-4 w-4" />
                          <span>{pallets} pallets</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}
        </section>

        {/* Ready to Start */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Ready to Start
          </div>

          {ready.length === 0 ? (
            <Card className="rounded-2xl border bg-card">
              <CardContent className="p-4 text-sm text-muted-foreground">
                No pending orders.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {ready.map((order: any, idx: number) => (
                <Card key={order.id} className="rounded-2xl border bg-card shadow-sm">
                  <CardContent className="p-6 pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                          <Box className="h-6 w-6 text-muted-foreground" />
                        </div>

                        <div className="min-w-0">
                          <div className="text-base font-bold text-foreground truncate">
                            {order.orderNumber ?? order.id}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">{order.customer}</div>

                          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              <span>{order.totalItems} items</span>
                            </div>
                            <span className="text-muted-foreground/30">•</span>
                            <div className="flex items-center gap-1">
                              <Box className="h-4 w-4" />
                              <span>{estimatePallets(order)} pallets</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* If you have priority in the order object, swap this out */}
                      <Badge variant={idx === 0 ? 'destructive' : 'secondary'}>
                        {idx === 0 ? 'High Priority' : 'Normal'}
                      </Badge>
                    </div>

                    <Button
                      onClick={() => handleStartOrder(order.id)}
                      size="sm"
                      className="mt-4 h-10 w-full rounded-xl"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Completed Today */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            Completed Today
          </div>

          {completedToday.length === 0 ? (
            <Card className="rounded-2xl border bg-card">
              <CardContent className="p-4 text-sm text-muted-foreground">
                Nothing completed yet.
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border bg-card shadow-sm">
              <CardContent className="p-0">
                {completedToday.map((order: any, idx: number) => (
                  <div
                    key={order.id}
                    className={cn(
                      'flex items-center justify-between p-4',
                      idx !== 0 && 'border-t border-border'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {order.orderNumber ?? order.id}
                        </div>
                        <div className="text-xs text-muted-foreground">{order.customer}</div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {order.completedAt
                        ? new Date(order.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
