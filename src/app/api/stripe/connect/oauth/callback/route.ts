import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('Stripe OAuth error:', error)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/payments?error=${encodeURIComponent(error)}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/payments?error=missing_params`)
    }

    // Extract user ID from state
    const userId = state.split('_')[0]
    if (!userId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/payments?error=invalid_state`)
    }

    // Exchange authorization code for access token
    const tokenResponse = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code: code,
    })

    const connectedAccountId = tokenResponse.stripe_user_id
    const accessToken = tokenResponse.access_token

    if (!connectedAccountId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/payments?error=no_account_id`)
    }

    // Get account details
    const account = await stripe.accounts.retrieve(connectedAccountId)

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

    // Update user profile with connected Stripe account
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const updateData: Record<string, unknown> = {}
    
    // Check if columns exist and update accordingly
    if (profile && 'stripe_account_id' in profile) {
      updateData.stripe_account_id = connectedAccountId
    }
    if (profile && 'stripe_charges_enabled' in profile) {
      updateData.stripe_charges_enabled = account.charges_enabled
    }
    
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        
      if (updateError) {
        console.error('Failed to update profile:', updateError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/payments?error=database_update_failed`)
      }
    } else {
      // Fallback to user metadata
      const { error: metadataError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            stripe_account_id: connectedAccountId,
            stripe_charges_enabled: account.charges_enabled,
            stripe_access_token: accessToken // Store for future API calls
          }
        }
      )
      
      if (metadataError) {
        console.error('Failed to update user metadata:', metadataError)
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/payments?error=metadata_update_failed`)
      }
    }

    console.log('✅ Stripe OAuth connection completed for user:', userId, 'account:', connectedAccountId)

    // Redirect back to payment settings with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/payments?success=true&oauth=true`)

  } catch (error) {
    console.error('Stripe OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings/payments?error=callback_failed`)
  }
}