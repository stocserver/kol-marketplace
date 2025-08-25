import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAccountLink } from '@/lib/stripe/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Get user profile with Stripe account ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !profile.stripe_account_id) {
      return NextResponse.redirect(new URL('/dashboard?error=no_stripe_account', request.url))
    }

    // Create new account link
    const accountLink = await createAccountLink(
      profile.stripe_account_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/refresh`,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?stripe_onboarding=success`
    )

    return NextResponse.redirect(accountLink.url)

  } catch (error) {
    console.error('Stripe Connect refresh error:', error)
    return NextResponse.redirect(new URL('/dashboard?error=stripe_refresh_failed', request.url))
  }
}