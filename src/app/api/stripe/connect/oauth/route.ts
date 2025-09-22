import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    // Only KOLs can connect Stripe accounts
    if (profile.user_type !== 'kol') {
      return NextResponse.json({ error: 'Only KOLs can connect Stripe accounts' }, { status: 403 })
    }

    // Create Stripe OAuth URL
    const state = `${user.id}_${Date.now()}` // Include user ID and timestamp for security
    const clientId = process.env.STRIPE_CLIENT_ID // You'll need to add this to your env

    if (!clientId) {
      return NextResponse.json({ 
        error: 'Stripe OAuth not configured. Please add STRIPE_CLIENT_ID to environment variables.' 
      }, { status: 500 })
    }

    const oauthUrl = new URL('https://connect.stripe.com/oauth/authorize')
    oauthUrl.searchParams.set('response_type', 'code')
    oauthUrl.searchParams.set('client_id', clientId)
    oauthUrl.searchParams.set('state', state)
    oauthUrl.searchParams.set('scope', 'read_write')
    oauthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/oauth/callback`)

    console.log('✅ Stripe OAuth URL created for user:', user.id)

    return NextResponse.json({
      oauth_url: oauthUrl.toString(),
      state: state
    })

  } catch (error) {
    console.error('Stripe OAuth URL creation error:', error)
    return NextResponse.json({ error: 'Failed to create OAuth URL' }, { status: 500 })
  }
}