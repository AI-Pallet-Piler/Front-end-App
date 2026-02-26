import { type NextRequest, NextResponse } from 'next/server'

// Note: Middleware disabled in favor of client-side checks
// Client-side useEffect in home-page checks localStorage for tokens
// and redirects to login if missing

export function middleware(request: NextRequest) {
  // Allow all requests to pass through
  // Authentication is handled on the client side via useEffect
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}


