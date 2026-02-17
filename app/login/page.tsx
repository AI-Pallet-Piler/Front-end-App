'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, Scan, LogIn, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
console.log('API_BASE_URL:', process.env.NEXT_PUBLIC_API_URL)

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pickerId, setPickerId] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAutoLogging, setIsAutoLogging] = useState(false)

  // Check for auto-login from web dashboard
  useEffect(() => {
    const badge = searchParams.get('badge')
    const auto = searchParams.get('auto')
    
    if (badge && auto === 'true') {
      setIsAutoLogging(true)
      performAutoLogin(badge)
    }
  }, [searchParams])

  const performAutoLogin = async (badge: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/badge/${badge}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        setIsAutoLogging(false)
        setError('Auto-login failed. Please enter your Picker ID manually.')
        return
      }

      const userData = await response.json()

      if (userData.role !== 'picker') {
        setIsAutoLogging(false)
        setError('This badge is not registered as a picker.')
        return
      }

      // Store picker information
      localStorage.setItem('pickerId', badge)
      localStorage.setItem('pickerName', userData.name)
      localStorage.setItem('pickerEmail', userData.email)

      // Redirect to dashboard
      router.push('/')
    } catch (err) {
      console.error('Auto-login error:', err)
      setIsAutoLogging(false)
      setError('Auto-login failed. Please enter your Picker ID manually.')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate picker ID
    if (!pickerId.trim()) {
      setError('Please enter your Picker ID')
      return
    }

    if (pickerId.length < 3) {
      setError('Picker ID must be at least 3 characters')
      return
    }

    setIsLoading(true)

    try {
      // Call the backend API to verify picker exists
      const response = await fetch(`${API_BASE_URL}/users/badge/${pickerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        if (response.status === 404) {
          setError('Picker ID not found. Please check and try again.')
        } else {
          setError('Login failed. Please try again.')
        }
        setIsLoading(false)
        return
      }

      const userData = await response.json()

      // Verify the user is a picker
      if (userData.role !== 'picker') {
        setError('This badge is not registered as a picker.')
        setIsLoading(false)
        return
      }

      // Store picker information
      localStorage.setItem('pickerId', pickerId)
      localStorage.setItem('pickerName', userData.name)
      localStorage.setItem('pickerEmail', userData.email)

      // Redirect to dashboard
      router.push('/')
    } catch (err) {
      console.error('Login error:', err)
      setError('Unable to connect to server. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleScanBadge = () => {
    // TODO: Implement barcode/QR scanner for badge scanning
    setError('')
    alert('Badge scanner will be implemented here')
  }

  // Show loading state during auto-login
  if (isAutoLogging) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-4 animate-pulse">
            <User className="h-10 w-10 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-semibold mb-2">Signing you in...</h2>
          <p className="text-muted-foreground">Please wait</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-4">
            <User className="h-10 w-10 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Warehouse Picking</h1>
          <p className="text-lg text-muted-foreground">Sign in to continue</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl text-center">Picker Login</CardTitle>
            <CardDescription className="text-base text-center">
              Enter your picker ID or scan your badge
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="border-2">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="text-base font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Picker ID Input */}
              <div className="space-y-3">
                <Label htmlFor="pickerId" className="text-base font-semibold">
                  Picker ID
                </Label>
                <Input
                  id="pickerId"
                  type="text"
                  placeholder="Enter your Picker ID"
                  value={pickerId}
                  onChange={(e) => setPickerId(e.target.value.toUpperCase())}
                  className="h-14 text-lg font-medium"
                  autoComplete="off"
                  autoFocus
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  Example: PICK0001, PICK0042, etc.
                </p>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                size="lg"
                className="h-16 w-full text-lg font-bold"
                disabled={isLoading}
              >
                <LogIn className="mr-3 h-6 w-6" />
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

            </form>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Device: WH-TABLET-042
          </p>
          <p className="text-sm text-muted-foreground">
            Distribution Center A
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            Need help? Contact your supervisor
          </p>
        </div>
      </div>
    </div>
  )
}