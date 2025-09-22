import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

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

    // Check if user already has a Stripe account
    if (profile.stripe_account_id) {
      // Get existing account status
      const account = await stripe.accounts.retrieve(profile.stripe_account_id)
      return NextResponse.json({
        account_id: account.id,
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        type: account.type
      })
    }

    // Create new Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // You can make this dynamic based on user input
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_type: 'individual', // Can be made dynamic
      metadata: {
        user_id: user.id,
        platform: 'kol-marketplace'
      }
    })

    // Update user profile with Stripe account ID
    // First check if columns exist
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    let updateData: any = {}
    
    // Only update columns that exist
    if (existingProfile && 'stripe_account_id' in existingProfile) {
      updateData.stripe_account_id = account.id
    }
    if (existingProfile && 'stripe_charges_enabled' in existingProfile) {
      updateData.stripe_charges_enabled = account.charges_enabled
    }
    
    // If no Stripe columns exist, we'll store in user metadata instead
    if (Object.keys(updateData).length === 0) {
      console.log('⚠️ Stripe columns missing, storing in user metadata as fallback')
      
      // Store in auth.users user_metadata as fallback
      const { error: metadataError } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,
            stripe_account_id: account.id,
            stripe_charges_enabled: account.charges_enabled
          }
        }
      )
      
      if (metadataError) {
        console.error('Failed to store Stripe data in user metadata:', metadataError)
        return NextResponse.json({ error: 'Failed to save Stripe account (metadata)' }, { status: 500 })
      }
      
      console.log('✅ Stripe data stored in user metadata as fallback')
    } else {
      // Update profiles table normally
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
      
      if (updateError) {
        console.error('Failed to update profile with Stripe account:', updateError)
        console.error('Update error details:', JSON.stringify(updateError, null, 2))
        console.error('Attempting to update user:', user.id)
        console.error('Update data:', updateData)
        return NextResponse.json({ 
          error: 'Failed to save Stripe account',
          details: updateError.message,
          code: updateError.code
        }, { status: 500 })
      }
      
      console.log('✅ Stripe data stored in profiles table')
    }


    console.log('✅ Stripe Connect account created:', account.id)

    return NextResponse.json({
      account_id: account.id,
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
      type: account.type
    })

  } catch (error) {
    console.error('Stripe Connect account creation error:', error)
    return NextResponse.json({ error: 'Failed to create Stripe account' }, { status: 500 })
  }
}