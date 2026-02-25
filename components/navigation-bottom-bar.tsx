'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ClipboardList, Home, Package, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWarehouseStore } from '@/lib/store'
import { useToast } from '@/lib/use-toast'

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const orders = useWarehouseStore((state) => state.orders)
  const activeOrderId = useWarehouseStore((state) => state.activeOrderId)
  const setActiveOrder = useWarehouseStore((state) => state.setActiveOrder)
  const { toast } = useToast()

  const inferredActiveOrderId =
    activeOrderId ?? orders.find((o) => o.status === 'in-progress')?.id ?? null

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
    },
    {
      href: '/picking',
      label: 'Active Order',
      icon: Package,
    },
    {
      href: '/reports',
      label: 'Reports',
      icon: ClipboardList,
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ]

  const handleActiveOrderClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!inferredActiveOrderId) {
      toast({
        title: 'No active order',
        description: 'Start an order from Home to begin picking.',
      })
      router.push('/picking')
      return
    }
    setActiveOrder(inferredActiveOrderId)
    router.push('/picking')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-lg">
      <div className="flex h-20 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href === '/picking' && pathname.startsWith('/picking')) ||
            (item.href === '/reports' && pathname.startsWith('/reports'))

          const className = cn(
            'flex min-h-[64px] min-w-[80px] flex-col items-center justify-center gap-1 rounded-lg px-4 py-2 transition-colors',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground',
          )

          if (item.href === '/picking') {
            return (
              <Link
                key={item.href}
                href="/picking"
                onClick={handleActiveOrderClick}
                className={className}
              >
                <Icon className="h-7 w-7" strokeWidth={2.5} />
                <span className="text-xs font-semibold">{item.label}</span>
              </Link>
            )
          }

          return (
            <Link key={item.href} href={item.href} className={className}>
              <Icon className="h-7 w-7" strokeWidth={2.5} />
              <span className="text-xs font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
