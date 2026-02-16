'use client'

import { useMemo, useState } from 'react'
import { AlertCircle, ClipboardList } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Input } from '@/components/ui/input'
import { BottomNav } from '@/components/navigation-bottom-bar'
import { useWarehouseStore, type IssueReport, type IssueType } from '@/lib/store'
import { useToast } from '@/lib/use-toast'

function typeLabel(type: IssueType) {
  switch (type) {
    case 'missing':
      return 'Missing'
    case 'damage':
      return 'Damaged'
    case 'blocked':
      return 'Blocked'
    case 'other':
      return 'Other'
  }
}

function typeBadgeVariant(type: IssueType): 'default' | 'secondary' | 'destructive' {
  switch (type) {
    case 'damage':
      return 'destructive'
    case 'missing':
      return 'default'
    case 'blocked':
      return 'secondary'
    case 'other':
      return 'secondary'
  }
}

function relativeTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return formatDistanceToNow(d, { addSuffix: true })
}

function ReportCard({ report }: { report: IssueReport }) {
  return (
    <Card className="rounded-2xl border bg-card shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">
              {report.orderNumber ?? `Order ${report.orderId}`}
            </div>
            <div className="text-xs text-muted-foreground">
              {relativeTime(report.createdAt)}
            </div>
          </div>

          <Badge variant={typeBadgeVariant(report.type)} className="rounded-full">
            {typeLabel(report.type)}
          </Badge>
        </div>

        {(report.taskLocation || report.taskSku) && (
          <div className="text-xs text-muted-foreground">
            {report.taskLocation ? `Location ${report.taskLocation}` : ''}
            {report.taskLocation && report.taskSku ? ' • ' : ''}
            {report.taskSku ? `SKU ${report.taskSku}` : ''}
          </div>
        )}

        <div className="text-sm text-foreground whitespace-pre-wrap break-words">
          {report.message}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  const reports = useWarehouseStore((s) => s.reports)
  const orders = useWarehouseStore((s) => s.orders)
  const addReport = useWarehouseStore((s) => s.addReport)
  const { toast } = useToast()

  const [createOpen, setCreateOpen] = useState(false)
  const [issueType, setIssueType] = useState<IssueType>('missing')
  const [orderQuery, setOrderQuery] = useState('')
  const [taskLocation, setTaskLocation] = useState('')
  const [taskSku, setTaskSku] = useState('')
  const [message, setMessage] = useState('')

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      const at = new Date(a.createdAt).getTime()
      const bt = new Date(b.createdAt).getTime()
      if (Number.isNaN(at) && Number.isNaN(bt)) return 0
      if (Number.isNaN(at)) return 1
      if (Number.isNaN(bt)) return -1
      return bt - at
    })
  }, [reports])

  const submitManualReport = () => {
    const m = message.trim()
    const q = orderQuery.trim()
    if (!q) {
      toast({
        title: 'Select an order',
        description: 'Enter an order number or id.',
      })
      return
    }
    if (!m) {
      toast({
        title: 'Add details',
        description: 'Please describe the issue before submitting.',
      })
      return
    }

    const match = orders.find(
      (o) => o.id === q || o.orderNumber?.toLowerCase() === q.toLowerCase(),
    )

    addReport({
      orderId: match?.id ?? q,
      orderNumber: match?.orderNumber,
      type: issueType,
      message: m,
      taskLocation: taskLocation.trim() || undefined,
      taskSku: taskSku.trim() || undefined,
    })

    setCreateOpen(false)
    setIssueType('missing')
    setOrderQuery('')
    setTaskLocation('')
    setTaskSku('')
    setMessage('')

    toast({
      title: 'Report created',
      description: 'Your report has been saved.',
    })
  }

  return (
    <div className="min-h-dvh bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Reports</h1>
          </div>

          <Button variant="destructive" className="rounded-xl" onClick={() => setCreateOpen(true)}>
            Create
          </Button>
        </div>
      </header>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create report</DialogTitle>
            <DialogDescription>
              Add a report even if you’re not inside an order.
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
              <div className="text-xs font-medium text-muted-foreground">Order</div>
              <Input
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="Order number (e.g. WH-2024-001235) or id"
                className="rounded-xl"
              />
              <div className="text-[11px] text-muted-foreground">
                Tip: you can paste the order number from Home.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Location (optional)</div>
                <Input
                  value={taskLocation}
                  onChange={(e) => setTaskLocation(e.target.value)}
                  placeholder="A-05-03-02"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">SKU (optional)</div>
                <Input
                  value={taskSku}
                  onChange={(e) => setTaskSku(e.target.value)}
                  placeholder="BRG-5032"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Details</div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what happened…"
                className="min-h-[140px] w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={submitManualReport}>
              Save report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="px-4 py-5 mx-auto w-full max-w-3xl space-y-4">
        {sortedReports.length === 0 ? (
          <Card className="rounded-2xl border bg-card shadow-sm">
            <CardContent className="p-6 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-sm font-semibold text-foreground">No reports yet</div>
              <div className="text-sm text-muted-foreground">
                Open an Active Order and use the Report button.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedReports.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
