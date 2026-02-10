'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()

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
      href: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-lg">
      <div className="flex h-20 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href === '/picking' && pathname.startsWith('/picking'))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-[64px] min-w-[80px] flex-col items-center justify-center gap-1 rounded-lg px-4 py-2 transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
              )}
            >
              <Icon className="h-7 w-7" strokeWidth={2.5} />
              <span className="text-xs font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
