'use client'

import { Bell, HelpCircle, Info, LogOut, Shield, TrendingUp, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { BottomNav } from '@/components/navigation-bottom-bar'
import { useState } from 'react'

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)

  const profile = {
    name: 'John Picker',
    badge: '#4782',
    warehouse: 'Warehouse A',
    zone: 'Zone 3',
  }

  const performance = {
    orders: 12,
    efficiency: 94,
  }

  return (
    <div className="min-h-dvh bg-background pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>
      </header>

      <main className="px-4 py-5 mx-auto w-full max-w-3xl space-y-6">
        {/* Profile */}
        <Card className="rounded-2xl border bg-card shadow-sm py-0">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-6 w-6" />
              </div>
              <div className="mt-2 text-sm font-semibold text-foreground">{profile.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">Badge {profile.badge}</div>
              <div className="text-xs text-muted-foreground">
                {profile.warehouse} • {profile.zone}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <section className="space-y-3">
          <div className="text-sm font-semibold text-foreground">Today's Performance</div>
          <div className="grid grid-cols-2 gap-3">
            <Card className="rounded-2xl border bg-card shadow-sm py-0">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Orders
                </div>
                <div className="mt-1 text-xl font-bold text-foreground">{performance.orders}</div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-card shadow-sm py-0">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  Efficiency
                </div>
                <div className="mt-1 text-xl font-bold text-foreground">{performance.efficiency}%</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Preferences */}
        <section className="space-y-3">
          <div className="text-sm font-semibold text-foreground">Preferences</div>

          <Card className="rounded-2xl border bg-card shadow-sm py-0">
            <CardContent className="p-0">
              <div className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-muted-foreground">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">Notifications</div>
                    <div className="text-xs text-muted-foreground">Manage alerts and sounds</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs font-medium text-primary">{notifications ? 'On' : 'Off'}</div>
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-muted-foreground">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">Privacy &amp; Security</div>
                    <div className="text-xs text-muted-foreground">Manage your data</div>
                  </div>
                </div>

              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-muted-foreground">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">Help &amp; Support</div>
                    <div className="text-xs text-muted-foreground">Get help or send feedback</div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </section>

        {/* About */}
        <Card className="rounded-2xl border bg-muted/30 shadow-sm py-0">
          <CardContent className="p-6 text-center">
            <div className="text-xs font-semibold text-foreground">AI Pallet Piller App</div>
            <div className="mt-1 text-[11px] text-muted-foreground">Version 1.0.0</div>
          </CardContent>
        </Card>

        {/* Sign out */}
        <Button
          variant="outline"
          className="h-12 w-full rounded-xl border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </main>

      <BottomNav />
    </div>
  )
}
