'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function PickingIndexPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="rounded-full bg-muted p-6">
            <AlertCircle className="h-16 w-16 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">No Active Order Selected</h2>
            <p className="text-base text-muted-foreground">
              To access the picking page, you need to start an order first. Please go to the home page and select an order.
            </p>
          </div>
          <Button 
            onClick={() => router.push('/')} 
            size="lg"
            className="w-full h-14 text-lg font-bold"
          >
            <Package className="mr-2 h-5 w-5" />
            View Available Orders
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
