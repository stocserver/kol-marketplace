import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion
})

export async function GET() {
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
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check for Stripe account ID in profiles table or user metadata
    let stripeAccountId = null
    let stripeChargesEnabled = false

    if (profile.stripe_account_id) {
      // Found in profiles table
      stripeAccountId = profile.stripe_account_id
      stripeChargesEnabled = profile.stripe_charges_enabled || false
    } else if (user.user_metadata?.stripe_account_id) {
      // Fallback to user metadata
      stripeAccountId = user.user_metadata.stripe_account_id
      stripeChargesEnabled = user.user_metadata.stripe_charges_enabled || false
      console.log('📋 Retrieved Stripe data from user metadata')
    }

    if (!stripeAccountId) {
      return NextResponse.json({
        connected: false,
        account_id: null,
        charges_enabled: false,
        details_submitted: false
      })
    }

    // Get latest account status from Stripe
    const account = await stripe.accounts.retrieve(stripeAccountId)

    // Update local profile if status changed (only if columns exist)
    if (account.charges_enabled !== stripeChargesEnabled && profile.stripe_charges_enabled !== undefined) {
      await supabase
        .from('profiles')
        .update({ stripe_charges_enabled: account.charges_enabled })
        .eq('id', user.id)
    }

    console.log('✅ Stripe account status retrieved:', account.id, 'charges_enabled:', account.charges_enabled)

    return NextResponse.json({
      connected: true,
      account_id: account.id,
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements,
      business_type: account.business_type,
      country: account.country
    })

  } catch (error) {
    console.error('Stripe account status error:', error)
    return NextResponse.json({ error: 'Failed to get account status' }, { status: 500 })
  }
}