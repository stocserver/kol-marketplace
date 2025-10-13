import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: { headers: req.headers } })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookies) {
            cookies.forEach(({ name, value, options }) => {
              res.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    await supabase.auth.getUser()
  } catch (error) {
    console.warn('Middleware Supabase session refresh failed:', error)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth/callback).*)',
  ],
}
