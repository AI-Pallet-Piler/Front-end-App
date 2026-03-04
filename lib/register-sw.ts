export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // Dev: unregister any SW + clear caches to prevent stale UI.
  if (process.env.NODE_ENV !== 'production') {
    const maybeClear = async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((r) => r.unregister()))

        if ('caches' in window) {
          const keys = await caches.keys()
          await Promise.all(keys.map((k) => caches.delete(k)))
        }

        console.log('[v0] Service Worker disabled (dev)')
      } catch (error) {
        console.log('[v0] Service Worker dev cleanup failed:', error)
      }
    }

    void maybeClear()
    return
  }

  // Production: register SW after load for PWA/offline support.
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[v0] Service Worker registered:', registration)
      })
      .catch((error) => {
        console.log('[v0] Service Worker registration failed:', error)
      })
  })
}
