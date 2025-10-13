import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendRevisionRequestedEmail, isEmailConfigured } from '@/lib/email'
import { notifyUser } from '@/lib/notifications'
import { createServiceClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { revisionNote } = await request.json()
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

    // Only sponsor can request revision
    if (order.sponsor_id !== user.id) {
      return NextResponse.json({ error: 'Only the sponsor can request revisions' }, { status: 403 })
    }

    // Order must be in delivered status to request revision
    if (order.status !== 'delivered') {
      return NextResponse.json({
        error: `Order must be in 'delivered' status to request revision. Current status: ${order.status}`
      }, { status: 400 })
    }

    // Update order status to revision
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'revision',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order status:', updateError)
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
    }

    // Load additional info for email
    let gigTitle: string | undefined
    let sponsorName: string | undefined
    try {
      const [gigRes, sponsorRes] = await Promise.all([
        supabase.from('gigs').select('title').eq('id', order.gig_id).single(),
        supabase.from('profiles').select('full_name, username').eq('id', order.sponsor_id).single(),
      ])
      gigTitle = gigRes.data?.title
      sponsorName = sponsorRes.data?.full_name || sponsorRes.data?.username
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
        await sendRevisionRequestedEmail({
          to: kolEmail,
          orderId,
          amount: order.amount,
          currency: 'USD',
          orderUrl,
          sponsorName,
          gigTitle,
          revisionNote,
        })
        console.log('✅ Revision requested email sent to KOL')
      } catch (e) {
        console.warn('Revision requested email failed:', e)
      }
    } else {
      console.log('Skipping email: missing KOL email or email config')
    }

    // In-app notification to KOL: revision requested
    try {
      await notifyUser({
        userId: order.kol_id,
        type: 'revision_requested',
        title: sponsorName ? `Revision requested by ${sponsorName}` : 'Revision requested',
        body: gigTitle ? `${gigTitle} — Order #${orderId}` : `Order #${orderId}`,
        targetPath: `/orders/${orderId}`,
        meta: { orderId, revisionNote }
      })
    } catch (e) {
      console.warn('Failed to create KOL revision_requested notification:', e)
    }

    return NextResponse.json({ success: true, orderId })

  } catch (error) {
    console.error('Revision request handler error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
