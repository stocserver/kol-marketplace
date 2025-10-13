import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export const runtime = 'nodejs'

async function handle(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')
  const cookieStore = await cookies()
  const cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[] = []

  // Debug logging
  const cookieHeader = req.headers.get('cookie') || ''
  const cookieNames = cookieHeader.split(';').map(p => p.trim().split('=')[0]).filter(Boolean)
  console.log('Auth callback request URL:', req.url)
  console.log('Auth callback cookies:', cookieNames)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookies) {
          cookies.forEach(cookie => cookiesToSet.push(cookie))
        },
      },
    }
  )

  if (!code) {
    const res = NextResponse.redirect(new URL('/login?error=missing_code', requestUrl.origin))
    cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('Auth callback error:', error.message)
    const res = NextResponse.redirect(new URL('/login?error=oauth_callback_failed', requestUrl.origin))
    cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
    return res
  }

  let redirectPath = '/login'

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      redirectPath = profile ? '/dashboard' : '/signup-complete'
    }
  } catch (err) {
    console.error('Auth callback profile lookup error:', err)
  }

  const res = NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
  cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
  return res
}

export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}

export const dynamic = 'force-dynamic'


