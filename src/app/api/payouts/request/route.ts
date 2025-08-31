import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { orderId, message } = await request.json()

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

    // Get user profile to verify KOL
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.user_type !== 'kol') {
      return NextResponse.json({ error: 'Only KOLs can request payouts' }, { status: 403 })
    }

    // Get order details and verify ownership
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('kol_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found or access denied' }, { status: 404 })
    }

    console.log('Order data for payout request:', {
      id: order.id,
      amount: order.amount,
      kol_earnings: order.kol_earnings,
      platform_fee: order.platform_fee,
      status: order.status
    })

    // Verify order is completed
    if (order.status !== 'completed') {
      return NextResponse.json({ error: 'Order must be completed before requesting payout' }, { status: 400 })
    }

    // Check if payout request already exists
    const { data: existingRequest, error: existingError } = await supabase
      .from('payout_requests')
      .select('id, status')
      .eq('order_id', orderId)
      .neq('status', 'rejected')
      .single()

    if (!existingError && existingRequest) {
      return NextResponse.json({ 
        error: `Payout request already exists with status: ${existingRequest.status}` 
      }, { status: 400 })
    }

    // Create payout request
    const { data: payoutRequest, error: createError } = await supabase
      .from('payout_requests')
      .insert({
        order_id: orderId,
        kol_id: user.id,
        amount: order.kol_earnings,
        platform_fee: order.platform_fee,
        kol_message: message || null
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating payout request:', createError)
      return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 })
    }

    // Update order payout status
    await supabase
      .from('orders')
      .update({ payout_status: 'requested' })
      .eq('id', orderId)

    console.log('✅ Payout request created:', payoutRequest.id, 'for order:', orderId)

    return NextResponse.json({
      success: true,
      payoutRequest: payoutRequest
    })

  } catch (error) {
    console.error('Payout request creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get payout requests for current user
export async function GET(request: NextRequest) {
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

    // Get user's payout requests
    const { data: payoutRequests, error } = await supabase
      .from('payout_requests')
      .select(`
        *,
        orders:order_id (
          id,
          amount,
          gig:gigs (title)
        )
      `)
      .eq('kol_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching payout requests:', error)
      return NextResponse.json({ error: 'Failed to fetch payout requests' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      payoutRequests
    })

  } catch (error) {
    console.error('Payout requests fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}