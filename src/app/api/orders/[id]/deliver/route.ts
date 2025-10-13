import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendOrderDeliveredEmail, isEmailConfigured } from '@/lib/email'
import { notifyUser } from '@/lib/notifications'
export const runtime = 'nodejs'
import { createServiceClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { message, submissionNumber } = await request.json()
    const { id: orderId } = await params

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

    // Only KOL can mark as delivered
    if (order.kol_id !== user.id) {
      return NextResponse.json({ error: 'Only the KOL can deliver the order' }, { status: 403 })
    }

    // Update order status to delivered
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'delivered',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order status:', updateError)
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
    }

    // Store submission details
    try {
      const submissionMessage = message || 'Work submitted for review'

      // Try to store in order_submissions table first
      const { error: submissionError } = await supabase
        .from('order_submissions')
        .insert({
          order_id: orderId,
          submission_number: submissionNumber || 1,
          message: submissionMessage,
          submitted_by: user.id
        })

      if (submissionError) {
        console.warn('order_submissions table not available, using fallback storage:', submissionError)

        // Fallback: Store in order table
        await supabase
          .from('orders')
          .update({
            last_submission_message: submissionMessage,
            last_submission_at: new Date().toISOString(),
            submission_count: submissionNumber || 1
          })
          .eq('id', orderId)
      }
    } catch (error) {
      console.warn('Could not store submission details:', error)
    }

    // Load additional info for email
    let gigTitle: string | undefined
    let kolName: string | undefined
    try {
      const [gigRes, kolRes] = await Promise.all([
        supabase.from('gigs').select('title').eq('id', order.gig_id).single(),
        supabase.from('profiles').select('full_name, username').eq('id', order.kol_id).single(),
      ])
      gigTitle = gigRes.data?.title
      kolName = kolRes.data?.full_name || kolRes.data?.username
    } catch {}

    // Get sponsor email via admin API
    let sponsorEmail: string | undefined
    try {
      const admin = createServiceClient()
      const { data: sponsorUser } = await admin.auth.admin.getUserById(order.sponsor_id)
      sponsorEmail = sponsorUser?.user?.email || undefined
    } catch (e) {
      console.warn('Could not fetch sponsor email:', e)
    }

    // Send notification email (best-effort)
    if (sponsorEmail && isEmailConfigured()) {
      const orderUrlBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const orderUrl = `${orderUrlBase}/orders/${orderId}`
      try {
        await sendOrderDeliveredEmail({
          to: sponsorEmail,
          orderId,
          amount: order.amount,
          currency: 'USD',
          orderUrl,
          kolName,
          gigTitle,
        })
        console.log('✅ Order delivered email sent to sponsor')
      } catch (e) {
        console.warn('Order delivered email failed:', e)
      }
    } else {
      console.log('Skipping email: missing sponsor email or email config')
    }

    // In-app notification to sponsor: order submitted
    try {
      const orderUrlBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const orderUrl = `${orderUrlBase}/orders/${orderId}`
      await notifyUser({
        userId: order.sponsor_id,
        type: 'order_submitted',
        title: kolName ? `Order submitted by ${kolName}` : 'Order submitted',
        body: gigTitle ? `${gigTitle} — Order #${orderId}` : `Order #${orderId}`,
        targetPath: `/orders/${orderId}`,
        meta: { orderId, orderUrl }
      })
    } catch (e) {
      console.warn('Failed to create sponsor order_submitted notification:', e)
    }

    return NextResponse.json({ success: true, orderId })

  } catch (error) {
    console.error('Order delivery handler error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
