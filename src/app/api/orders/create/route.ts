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
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ User authenticated:', user.id)

    // Get user profile (buyer can be either sponsor or KOL)
    const { data: buyerProfile, error: buyerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (buyerError || !buyerProfile) {
      console.error('❌ Profile error:', buyerError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    console.log('✅ User profile:', buyerProfile.user_type)

    // Sponsors, KOLs, and admins can create orders
    if (!['sponsor', 'kol', 'admin'].includes(buyerProfile.user_type)) {
      console.error('❌ Invalid user type:', buyerProfile.user_type)
      return NextResponse.json({ error: 'Invalid user type for creating orders' }, { status: 403 })
    }
    console.log('✅ User type valid:', buyerProfile.user_type)

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
      console.error('❌ Self-purchase attempt:', user.id, 'gig owner:', gig.kol_id)
      return NextResponse.json({ error: 'You cannot purchase your own gig' }, { status: 403 })
    }
    console.log('✅ Not self-purchase, proceeding...')

    // Note: Individual KOL Stripe accounts not required for platform payments
    console.log('✅ Skipping individual KOL Stripe account check - using platform account')
    
    console.log('Creating order for gig:', gig.id, 'KOL:', gig.kol.username, 'Buyer:', buyerProfile.username)

    // Calculate fees (15% platform fee)
    const amount = gig.price
    const platformFeePercentage = 0.15
    const platformFee = Math.round(amount * platformFeePercentage)
    const kolEarnings = amount - platformFee

    // Create order record
    console.log('✅ Creating order record...', {
      gigId,
      sponsorId: user.id,
      kolId: gig.kol_id,
      amount,
      platformFee,
      kolEarnings
    })

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
      console.error('❌ Order creation failed:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }
    console.log('✅ Order created:', order.id)

    // Create Stripe payment intent - charge full amount to platform
    // Payouts to KOL will be handled separately based on DB calculations
    console.log('✅ Creating payment intent for amount:', amount)
    const paymentIntent = await createPaymentIntent(amount)
    console.log('✅ Payment intent created:', paymentIntent.id)
    
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