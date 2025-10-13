import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const pid = request.nextUrl.searchParams.get('pid')
    if (!pid) {
      return NextResponse.json({ error: 'Missing pid' }, { status: 400 })
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, sponsor_id, kol_id')
      .eq('stripe_payment_intent_id', pid)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Access control: only sponsor or KOL can view
    if (order.sponsor_id !== user.id && order.kol_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ orderId: order.id })
  } catch (err) {
    console.error('by-payment-intent error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

