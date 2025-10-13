import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notifyUser } from '@/lib/notifications'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { reason } = await request.json()
    const { id: orderId } = await params

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Dispute reason is required' }, { status: 400 })
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

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Only sponsor or KOL can open dispute
    if (order.sponsor_id !== user.id && order.kol_id !== user.id) {
      return NextResponse.json({ error: 'Only the sponsor or KOL can open a dispute' }, { status: 403 })
    }

    // Check if dispute already exists for this order
    const { data: existingDispute } = await supabase
      .from('disputes')
      .select('id, status')
      .eq('order_id', orderId)
      .in('status', ['open', 'under_review'])
      .single()

    if (existingDispute) {
      return NextResponse.json({
        error: 'A dispute is already open for this order',
        disputeId: existingDispute.id
      }, { status: 400 })
    }

    // Create dispute
    const { data: dispute, error: disputeError } = await supabase
      .from('disputes')
      .insert({
        order_id: orderId,
        opened_by: user.id,
        reason: reason.trim(),
        status: 'open'
      })
      .select()
      .single()

    if (disputeError) {
      console.error('Error creating dispute:', disputeError)
      return NextResponse.json({ error: 'Failed to create dispute' }, { status: 500 })
    }

    // Update order status to disputed
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        status: 'disputed',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (orderUpdateError) {
      console.error('Error updating order status:', orderUpdateError)
      // Don't fail the request, dispute is still created
    }

    console.log('✅ Dispute created:', dispute.id)

    // TODO: Send email notifications to admin, sponsor, and KOL

    // In-app notification to the other party
    try {
      const otherUserId = user.id === order.sponsor_id ? order.kol_id : order.sponsor_id
      await notifyUser({
        userId: otherUserId,
        type: 'order_disputed',
        title: 'Dispute opened on order',
        body: `Order #${orderId} has a new dispute`,
        targetPath: `/orders/${orderId}`,
        meta: { orderId, disputeId: dispute.id }
      })
    } catch (e) {
      console.warn('Failed to create order_disputed notification:', e)
    }

    return NextResponse.json({
      success: true,
      disputeId: dispute.id,
      message: 'Dispute opened successfully. An admin will review your case.'
    })

  } catch (error) {
    console.error('Dispute creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
