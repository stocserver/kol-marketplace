import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createConnectAccount, createAccountLink } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only KOLs can create Connect accounts
    if (profile.user_type !== 'kol') {
      return NextResponse.json({ error: 'Only KOLs can create Stripe Connect accounts' }, { status: 403 })
    }

    // Check if user already has a Stripe account
    if (profile.stripe_account_id) {
      return NextResponse.json({ error: 'User already has a Stripe Connect account' }, { status: 400 })
    }

    // Create Stripe Connect account
    const account = await createConnectAccount(user.email!)

    // Update profile with Stripe account ID
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        stripe_account_id: account.id,
        stripe_onboarding_complete: false,
        stripe_charges_enabled: false,
        stripe_payouts_enabled: false
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save Stripe account ID' }, { status: 500 })
    }

    // Create account link for onboarding
    const accountLink = await createAccountLink(
      account.id,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/refresh`,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?stripe_onboarding=success`
    )

    return NextResponse.json({ 
      accountId: account.id,
      onboardingUrl: accountLink.url 
    })

  } catch (error) {
    console.error('Stripe Connect account creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}