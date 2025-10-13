import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendOrderCompletedEmail, isEmailConfigured } from '@/lib/email'
import { createServiceClient } from '@/lib/supabase/admin'
import { notifyUser } from '@/lib/notifications'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const orderId = resolvedParams.id
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

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        gigs!inner (
          id,
          title,
          kol_id
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Only the sponsor (buyer) can mark order as completed
    if (order.sponsor_id !== user.id) {
      return NextResponse.json({ error: 'Only the order sponsor can mark order as completed' }, { status: 403 })
    }

    // Order must be in delivered status to be completed
    if (order.status !== 'delivered') {
      return NextResponse.json({ 
        error: `Order must be in 'delivered' status to be completed. Current status: ${order.status}` 
      }, { status: 400 })
    }

    // Mark order as completed
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating order status:', updateError)
      return NextResponse.json({ error: 'Failed to complete order' }, { status: 500 })
    }

    console.log(`✅ Order ${orderId} marked as completed by sponsor`)

    // Notify KOL the order is completed
    try {
      await notifyUser({
        userId: order.kol_id,
        type: 'order_completed',
        title: 'Order completed',
        body: `Order #${orderId} has been marked completed`,
        targetPath: `/orders/${orderId}`,
        meta: { orderId },
      })
    } catch (e) {
      console.warn('Failed to create KOL order_completed notification:', e)
    }

    // Email KOL (best-effort)
    try {
      const configured = isEmailConfigured()
      console.log('Email configured for completion route:', configured)
      if (configured) {
        const admin = createServiceClient()
        const { data: kolUser } = await admin.auth.admin.getUserById(order.kol_id)
        const kolEmail = kolUser?.user?.email
        console.log('KOL email for completion route:', kolEmail)
        if (kolEmail) {
          const orderUrlBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const orderUrl = `${orderUrlBase}/orders/${orderId}`
          await sendOrderCompletedEmail({
            to: kolEmail,
            orderId,
            amount: order.amount,
            currency: 'USD',
            orderUrl,
            sponsorName: undefined,
            gigTitle: (order as any)?.gigs?.title,
          })
          console.log('Order completed email dispatched to KOL')
        } else {
          console.log('Skipping completion email: KOL email not found for', order.kol_id)
        }
      } else {
        console.log('Skipping completion email: email not configured')
      }
    } catch (e) {
      console.warn('Order completed email to KOL failed:', e)
    }

    // Check if there's a pending payout request for this order
    const { data: payoutRequest } = await supabase
      .from('payout_requests')
      .select('id, status')
      .eq('order_id', orderId)
      .single()

    let autoProcessMessage = ''
    if (payoutRequest && payoutRequest.status === 'pending') {
      autoProcessMessage = '. Payout request is pending and can now be auto-approved.'
    }

    return NextResponse.json({
      success: true,
      message: `Order completed successfully${autoProcessMessage}`,
      order: updatedOrder,
      payoutRequestId: payoutRequest?.id
    })

  } catch (error) {
    console.error('Order completion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
