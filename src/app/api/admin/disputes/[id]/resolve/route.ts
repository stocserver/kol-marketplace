import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createRefund } from '@/lib/stripe/server'
export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { resolutionType, resolutionNotes } = await request.json()
    const { id: disputeId } = await params

    if (!resolutionType || !['continue', 'cancel_refund'].includes(resolutionType)) {
      return NextResponse.json({
        error: 'Invalid resolution type. Must be "continue" or "cancel_refund"'
      }, { status: 400 })
    }

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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Fetch dispute with order details
    const { data: dispute, error: disputeError } = await supabase
      .from('disputes')
      .select(`
        *,
        order:orders(*)
      `)
      .eq('id', disputeId)
      .single()

    if (disputeError || !dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    if (dispute.status === 'resolved') {
      return NextResponse.json({ error: 'Dispute already resolved' }, { status: 400 })
    }

    type OrderRow = {
      id: string
      amount: number
      stripe_payment_intent_id?: string | null
    }
    const order = dispute.order as OrderRow | null

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    let newOrderStatus: string
    let refundAmount: number | null = null
    let refundId: string | null = null

    if (resolutionType === 'continue') {
      // Admin decides to let KOL continue the job
      newOrderStatus = 'in_progress'
      console.log('✅ Dispute resolved: Continue job')
    } else {
      // Admin decides to cancel and refund
      newOrderStatus = 'cancelled'

      // Calculate refund amount (base order amount only, not including stripe_fee and service_fee)
      refundAmount = order.amount

      // Process refund via Stripe
      if (order.stripe_payment_intent_id) {
        try {
          const refund = await createRefund(
            order.stripe_payment_intent_id,
            refundAmount,
            'requested_by_customer'
          )
          refundId = refund.id
          console.log('✅ Refund processed:', refund.id, 'Amount:', refundAmount)
        } catch (refundError) {
          console.error('❌ Refund failed:', refundError)
          return NextResponse.json({
            error: 'Failed to process refund through Stripe',
            details: refundError
          }, { status: 500 })
        }
      }
    }

    // Update dispute status
    const { error: disputeUpdateError } = await supabase
      .from('disputes')
      .update({
        status: 'resolved',
        resolution_type: resolutionType,
        resolution_notes: resolutionNotes || null,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', disputeId)

    if (disputeUpdateError) {
      console.error('Error updating dispute:', disputeUpdateError)
      return NextResponse.json({ error: 'Failed to update dispute' }, { status: 500 })
    }

    // Update order status and refund info
    const orderUpdate: { status: string; updated_at: string; refund_amount?: number; stripe_refund_id?: string } = {
      status: newOrderStatus,
      updated_at: new Date().toISOString()
    }

    if (refundAmount) {
      orderUpdate.refund_amount = refundAmount
    }

    if (refundId) {
      orderUpdate.stripe_refund_id = refundId
    }

    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update(orderUpdate)
      .eq('id', order.id)

    if (orderUpdateError) {
      console.error('Error updating order:', orderUpdateError)
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
    }

    console.log('✅ Dispute resolved successfully:', disputeId)

    // TODO: Send email notifications to sponsor and KOL

    return NextResponse.json({
      success: true,
      disputeId: disputeId,
      resolutionType: resolutionType,
      newOrderStatus: newOrderStatus,
      refundAmount: refundAmount,
      message: `Dispute resolved: ${resolutionType === 'continue' ? 'Order continues' : 'Order cancelled and refunded'}`
    })

  } catch (error) {
    console.error('Dispute resolution error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
