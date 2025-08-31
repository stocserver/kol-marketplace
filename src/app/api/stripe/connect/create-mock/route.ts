import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Mock Stripe Connect for development/testing
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

    // Get authenticated user
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

    // Only KOLs can create Stripe Connect accounts
    if (profile.user_type !== 'kol') {
      return NextResponse.json({ error: 'Only KOLs can connect Stripe accounts' }, { status: 403 })
    }

    // Check if user already has a mock Stripe account
    if (profile.stripe_account_id) {
      return NextResponse.json({
        account_id: profile.stripe_account_id,
        charges_enabled: profile.stripe_charges_enabled || true,
        details_submitted: true,
        type: 'express'
      })
    }

    // Create mock Stripe Connect Express account
    const mockAccountId = `acct_mock_${user.id.replace(/-/g, '').substring(0, 16)}`
    
    // Update user profile with mock Stripe account ID
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        stripe_account_id: mockAccountId,
        stripe_charges_enabled: true
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update profile with mock Stripe account:', updateError)
      return NextResponse.json({ error: 'Failed to save Stripe account' }, { status: 500 })
    }

    console.log('✅ Mock Stripe Connect account created:', mockAccountId)

    return NextResponse.json({
      account_id: mockAccountId,
      charges_enabled: true,
      details_submitted: true,
      type: 'express',
      mock: true
    })

  } catch (error) {
    console.error('Mock Stripe Connect account creation error:', error)
    return NextResponse.json({ error: 'Failed to create Stripe account' }, { status: 500 })
  }
}