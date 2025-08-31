import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createPaymentIntent } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    const { gigId, requirements } = await request.json()
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

    // Get user profile (buyer can be either sponsor or KOL)
    const { data: buyerProfile, error: buyerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (buyerError || !buyerProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Both sponsors and KOLs can create orders (KOLs can purchase from other KOLs)
    if (!['sponsor', 'kol'].includes(buyerProfile.user_type)) {
      return NextResponse.json({ error: 'Invalid user type for creating orders' }, { status: 403 })
    }

    // Get gig details
    const { data: gig, error: gigError } = await supabase
      .from('gigs')
      .select(`
        *,
        kol:profiles!gigs_kol_id_fkey(*)
      `)
      .eq('id', gigId)
      .eq('is_active', true)
      .single()

    if (gigError || !gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 })
    }

    // Prevent users from purchasing their own gigs
    if (gig.kol_id === user.id) {
      return NextResponse.json({ error: 'You cannot purchase your own gig' }, { status: 403 })
    }

    // Check if KOL has Stripe account (required for payouts)
    if (!gig.kol.stripe_account_id) {
      return NextResponse.json({ 
        error: 'KOL has not completed Stripe Connect setup and cannot receive payments' 
      }, { status: 400 })
    }
    
    console.log('Creating order for gig:', gig.id, 'KOL:', gig.kol.username, 'Buyer:', buyerProfile.username)

    // Calculate fees (15% platform fee)
    const amount = gig.price
    const platformFeePercentage = 0.15
    const platformFee = Math.round(amount * platformFeePercentage)
    const kolEarnings = amount - platformFee

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        gig_id: gigId,
        sponsor_id: user.id,
        kol_id: gig.kol_id,
        status: 'pending',
        amount: amount,
        platform_fee: platformFee,
        kol_earnings: kolEarnings,
        requirements: requirements || null,
        stripe_application_fee: platformFee
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Create Stripe payment intent for sponsor to pay platform
    // Platform holds the funds until payout is approved
    const paymentIntent = await createPaymentIntent(
      amount,
      gig.kol.stripe_account_id,
      platformFee
    )
    
    // Update order with payment intent
    await supabase
      .from('orders')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', order.id)

    // Create payment attempt record
    await supabase
      .from('payment_attempts')
      .insert({
        order_id: order.id,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'created',
        amount: amount,
        application_fee_amount: platformFee
      })

    console.log('✅ Order created successfully:', order.id)

    return NextResponse.json({
      orderId: order.id,
      clientSecret: paymentIntent.client_secret,
      amount: amount,
      platformFee: platformFee,
      kolEarnings: kolEarnings
    })

  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}