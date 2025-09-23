import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createRefund } from '@/lib/stripe/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { amount, reason } = await request.json()
    const resolvedParams = await params
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

    // Get user profile to check permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', resolvedParams.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check permissions - only order owner, KOL, or admin can request refund
    const canRefund =
      userProfile.user_type === 'admin' ||
      order.sponsor_id === user.id ||
      order.kol_id === user.id

    if (!canRefund) {
      return NextResponse.json({ error: 'Not authorized to refund this order' }, { status: 403 })
    }

    // Check if order is already refunded
    if (order.status === 'refunded') {
      return NextResponse.json({ error: 'Order already refunded' }, { status: 400 })
    }

    // Check if order is paid (can't refund unpaid orders)
    if (order.status !== 'paid' && order.status !== 'completed') {
      return NextResponse.json({ error: 'Cannot refund unpaid order' }, { status: 400 })
    }

    // Process refund with Stripe
    const refund = await createRefund(
      order.stripe_payment_intent_id,
      amount, // Optional partial amount
      reason || 'requested_by_customer'
    )

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: amount && amount < order.amount ? 'partially_refunded' : 'refunded',
        refund_amount: amount || order.amount,
        stripe_refund_id: refund.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedParams.id)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
    }

    console.log('✅ Refund processed successfully:', refund.id)

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount / 100, // Convert back to dollars
      status: refund.status
    })

  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}