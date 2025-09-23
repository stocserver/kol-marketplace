import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Get all payout requests (admin only)
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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth result:', { user: user?.email, error: authError })
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: authError?.message 
      }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, email')
      .eq('id', user.id)
      .single()

    console.log('Profile result:', { profile, error: profileError })

    const isAdmin = profile?.user_type === 'admin' || 
                    user.email === 'admin@kolmarketplace.com' || 
                    user.email?.endsWith('@admin.com') ||
                    user.email === 'ivn.c.yu@gmail.com'

    console.log('Admin check:', { isAdmin, userEmail: user.email, profileUserType: profile?.user_type })

    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Admin access required',
        userEmail: user.email,
        profileUserType: profile?.user_type
      }, { status: 403 })
    }

    console.log('Admin attempting to fetch payout requests...')

    // First, try to get basic payout requests without joins
    const { data: basicPayouts, error: basicError } = await supabase
      .from('payout_requests')
      .select('*')
      .order('requested_at', { ascending: false })

    console.log('Basic payout requests result:', { 
      count: basicPayouts?.length, 
      firstRequest: basicPayouts?.[0],
      error: basicError 
    })

    if (basicError) {
      console.error('Error fetching basic payout requests:', basicError)
      return NextResponse.json({ 
        error: 'Failed to fetch payout requests', 
        details: basicError.message,
        code: basicError.code 
      }, { status: 500 })
    }

    // Try the join query with correct foreign key reference
    const { data: payoutRequests, error } = await supabase
      .from('payout_requests')
      .select(`
        *,
        orders!inner (
          id,
          amount,
          kol_earnings,
          platform_fee,
          gigs!inner (title)
        ),
        profiles!payout_requests_kol_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          stripe_account_id,
          user_type
        )
      `)
      .order('requested_at', { ascending: false })

    console.log('Joined payout requests result:', { 
      count: payoutRequests?.length,
      error,
      sample: payoutRequests?.[0] 
    })

    if (error) {
      console.error('Error fetching joined payout requests:', error)
      
      // Fallback: Manually fetch related data
      console.log('Using fallback data fetching for', basicPayouts.length, 'payout requests')
      
      const enrichedPayouts = await Promise.all(
        basicPayouts.map(async (payout) => {
          console.log('Fetching data for payout:', payout.id, 'kol_id:', payout.kol_id, 'order_id:', payout.order_id)
          
          // Fetch KOL profile
          const { data: kol, error: kolError } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, stripe_account_id, user_type')
            .eq('id', payout.kol_id)
            .single()

          console.log('KOL fetch result:', { kol, error: kolError })

          // Fetch order and gig data
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
              id,
              amount,
              kol_earnings,
              platform_fee,
              gigs (title)
            `)
            .eq('id', payout.order_id)
            .single()

          console.log('Order fetch result:', { order, error: orderError })

          return {
            ...payout,
            profiles: kol,
            orders: order
          }
        })
      )
      
      console.log('Enriched payouts sample:', enrichedPayouts[0])

      return NextResponse.json({
        success: true,
        payoutRequests: enrichedPayouts,
        warning: 'Used fallback data fetching due to join error: ' + error.message
      })
    }

    return NextResponse.json({
      success: true,
      payoutRequests
    })

  } catch (error) {
    console.error('Admin payout requests fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Update payout request status (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { payoutId, status, adminNotes } = await request.json()

    if (!payoutId || !status) {
      return NextResponse.json({ error: 'Payout ID and status are required' }, { status: 400 })
    }

    if (!['approved', 'rejected', 'completed', 'failed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, email')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.user_type === 'admin' || 
                    user.email === 'admin@kolmarketplace.com' || 
                    user.email?.endsWith('@admin.com') ||
                    user.email === 'ivn.c.yu@gmail.com'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Update payout request
    const { data: updatedPayout, error: updateError } = await supabase
      .from('payout_requests')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes || null
      })
      .eq('id', payoutId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating payout request:', updateError)
      return NextResponse.json({ error: 'Failed to update payout request' }, { status: 500 })
    }

    console.log(`✅ Payout request ${payoutId} updated to ${status} by admin ${user.email}`)

    return NextResponse.json({
      success: true,
      payout: updatedPayout
    })

  } catch (error) {
    console.error('Admin payout update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}