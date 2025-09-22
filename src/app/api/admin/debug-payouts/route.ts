import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
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

    // Test 1: Get raw payout requests
    const { data: payouts, error: payoutError } = await supabase
      .from('payout_requests')
      .select('*')

    // Test 2: Get profiles separately  
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)

    // Test 3: Get orders separately
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .limit(5)

    // Test 4: Try the join query
    const { data: joinedData, error: joinError } = await supabase
      .from('payout_requests')
      .select(`
        *,
        profiles!payout_requests_kol_id_fkey (
          id,
          username,
          full_name,
          email,
          user_type
        )
      `)

    // Test 5: Manual join by matching IDs
    let manualJoin = null
    if (payouts && payouts.length > 0 && profiles) {
      const firstPayout = payouts[0]
      const matchingProfile = profiles.find(p => p.id === firstPayout.kol_id)
      manualJoin = {
        payout: firstPayout,
        matchingProfile
      }
    }

    return NextResponse.json({
      success: true,
      debug: {
        payouts: { count: payouts?.length || 0, data: payouts?.[0], error: payoutError },
        profiles: { count: profiles?.length || 0, sample: profiles?.[0], error: profileError },
        orders: { count: orders?.length || 0, sample: orders?.[0], error: orderError },
        joinQuery: { count: joinedData?.length || 0, data: joinedData?.[0], error: joinError },
        manualJoin
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}