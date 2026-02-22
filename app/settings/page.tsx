'use client'

import { Settings as SettingsIcon, Sun, HelpCircle, LogOut, Smartphone, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { BottomNav } from '@/components/navigation-bottom-bar'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const [brightness, setBrightness] = useState(true)
  const router = useRouter()

  const handleSwitchUser = () => {
    // Clear current user session
    localStorage.removeItem('pickerId')
    // Navigate to login page
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-primary px-6 py-6 shadow-md">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-9 w-9 text-primary-foreground" strokeWidth={2.5} />
          <h1 className="text-2xl font-bold text-primary-foreground">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        <div className="space-y-6">
          {/* Device Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Smartphone className="h-6 w-6 text-primary" />
                Device Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-base font-medium text-muted-foreground">
                  Device ID
                </span>
                <span className="text-base font-bold text-foreground">
                  WH-TABLET-042
                </span>
              </div>
              <Separator />
              <div className="flex justify-between py-2">
                <span className="text-base font-medium text-muted-foreground">
                  Warehouse
                </span>
                <span className="text-base font-bold text-foreground">
                  Distribution Center A
                </span>
              </div>
              <Separator />
              <div className="flex justify-between py-2">
                <span className="text-base font-medium text-muted-foreground">
                  App Version
                </span>
                <span className="text-base font-bold text-foreground">v1.0.0</span>
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sun className="h-6 w-6 text-primary" />
                Display Settings
              </CardTitle>
              <CardDescription className="text-base">
                Adjust display for warehouse environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-3">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">
                    High Brightness Mode
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Optimized for bright warehouse lighting
                  </p>
                </div>
                <Switch
                  checked={brightness}
                  onCheckedChange={setBrightness}
                  className="data-[state=checked]:bg-accent"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pallet Building Preview (Coming Soon) */}
          <Card className="border-2 border-dashed border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Info className="h-6 w-6 text-muted-foreground" />
                Upcoming Feature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 rounded-lg bg-muted p-6 text-center">
                <p className="text-lg font-bold text-foreground">
                  Pallet Building Preview
                </p>
                <p className="text-base text-muted-foreground">
                  3D pallet stacking visualization coming soon
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <Button
              variant="outline"
              size="lg"
              className="h-16 w-full justify-start text-lg font-semibold bg-transparent"
            >
              <HelpCircle className="mr-3 h-6 w-6" />
              Help & Support
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-16 w-full justify-start text-lg font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
              onClick={handleSwitchUser}
            >
              <LogOut className="mr-3 h-6 w-6" />
              Switch User
            </Button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}