import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendOrderReceivedEmail, isEmailConfigured } from '@/lib/email'
import { createServiceClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { paymentIntentId } = await request.json()
    const { id: orderId } = await params

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Missing paymentIntentId' }, { status: 400 })
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

    // Only sponsor can mark as paid (client-side confirmation)
    if (order.sponsor_id !== user.id) {
      return NextResponse.json({ error: 'Only the sponsor can mark order as paid' }, { status: 403 })
    }

    // If already paid, return idempotently
    if (order.status === 'paid') {
      return NextResponse.json({ success: true, orderId })
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        stripe_payment_intent_id: paymentIntentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order status:', updateError)
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
    }

    // Load additional info for email
    let gigTitle: string | undefined
    let buyerName: string | undefined
    try {
      const [gigRes, buyerRes] = await Promise.all([
        supabase.from('gigs').select('title').eq('id', order.gig_id).single(),
        supabase.from('profiles').select('full_name, username').eq('id', order.sponsor_id).single(),
      ])
      gigTitle = gigRes.data?.title
      buyerName = buyerRes.data?.full_name || buyerRes.data?.username
    } catch {}

    // Get KOL email via admin API
    let kolEmail: string | undefined
    try {
      const admin = createServiceClient()
      const { data: kolUser } = await admin.auth.admin.getUserById(order.kol_id)
      kolEmail = kolUser?.user?.email || undefined
    } catch (e) {
      console.warn('Could not fetch KOL email:', e)
    }

    // Send notification email (best-effort)
    if (kolEmail && isEmailConfigured()) {
      const orderUrlBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const orderUrl = `${orderUrlBase}/orders/${orderId}`
      try {
        await sendOrderReceivedEmail({
          to: kolEmail,
          orderId,
          amount: order.amount,
          currency: 'USD',
          orderUrl,
          buyerName,
          gigTitle,
        })
      } catch (e) {
        console.warn('Order paid email failed:', e)
      }
    } else {
      console.log('Skipping email: missing KOL email or email config')
    }

    return NextResponse.json({ success: true, orderId })

  } catch (error) {
    console.error('Order paid handler error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

