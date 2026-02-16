'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/register-sw'

export function PWAInit() {
  useEffect(() => {
    // If an old SW is controlling this tab, dev changes can appear “stuck”.
    // Force a one-time cleanup + reload in development.
    if (process.env.NODE_ENV !== 'production' && 'serviceWorker' in navigator) {
      const key = 'warepick_dev_sw_cleaned'
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        navigator.serviceWorker.getRegistrations().then((regs) => {
          return Promise.all(regs.map((r) => r.unregister()))
        }).then(async () => {
          if ('caches' in window) {
            const keys = await caches.keys()
            await Promise.all(keys.map((k) => caches.delete(k)))
          }
        }).finally(() => {
          window.location.reload()
        })
        return
      }
    }

    registerServiceWorker()
  }, [])

  return null
}
