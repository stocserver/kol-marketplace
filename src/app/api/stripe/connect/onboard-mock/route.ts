import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Mock Stripe onboarding for development/testing
export async function POST() {
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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with Stripe account
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !profile.stripe_account_id) {
      return NextResponse.json({ error: 'Stripe account not found' }, { status: 404 })
    }

    // Create mock onboarding URL that redirects back to success page
    const mockOnboardingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings/payments?success=true&mock=true`

    console.log('✅ Mock Stripe onboarding link created for account:', profile.stripe_account_id)

    return NextResponse.json({
      onboarding_url: mockOnboardingUrl
    })

  } catch (error) {
    console.error('Mock Stripe onboarding link creation error:', error)
    return NextResponse.json({ error: 'Failed to create onboarding link' }, { status: 500 })
  }
}