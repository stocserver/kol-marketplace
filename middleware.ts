import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  console.log('Middleware: Request to:', request.nextUrl.pathname)
  
  // Skip middleware for auth callback and other routes that don't need auth
  if (
    request.nextUrl.pathname.startsWith('/api/auth/callback') ||
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup-complete') ||
    request.nextUrl.pathname.startsWith('/auth-success') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon')
  ) {
    console.log('Middleware: Skipping middleware for:', request.nextUrl.pathname)
    return NextResponse.next()
  }
  
  // For protected routes, just pass through for now since we're using localStorage auth
  console.log('Middleware: Allowing access to:', request.nextUrl.pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}