import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// Auto-approve and process payout requests for completed orders
export async function POST(request: NextRequest) {
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

    // Get authenticated user (admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = user.email === 'admin@kolmarketplace.com' || 
                    user.email?.endsWith('@admin.com') ||
                    user.email === 'ivn.c.yu@gmail.com'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all pending payout requests for completed orders
    const { data: pendingPayouts, error: payoutsError } = await supabase
      .from('payout_requests')
      .select(`
        *,
        profiles!payout_requests_kol_id_fkey (
          id,
          username,
          full_name,
          stripe_account_id
        ),
        orders!inner (
          id,
          status,
          amount,
          kol_earnings
        )
      `)
      .eq('status', 'pending')
      .eq('orders.status', 'completed')

    if (payoutsError) {
      return NextResponse.json({ error: 'Failed to fetch pending payouts' }, { status: 500 })
    }

    if (!pendingPayouts || pendingPayouts.length === 0) {
      return NextResponse.json({ 
        message: 'No pending payouts for completed orders found',
        processed: 0 
      })
    }

    console.log(`🔄 Processing ${pendingPayouts.length} pending payouts for completed orders`)

    const results = await Promise.allSettled(
      pendingPayouts.map(async (payout) => {
        try {
          // Check if KOL has connected Stripe account
          if (!payout.profiles.stripe_account_id) {
            console.warn(`❌ Skipping payout ${payout.id} - KOL ${payout.profiles.username} has no Stripe account`)
            return { 
              payoutId: payout.id, 
              status: 'skipped', 
              reason: 'No Stripe account' 
            }
          }

          // Auto-approve the payout
          const { error: approveError } = await supabase
            .from('payout_requests')
            .update({
              status: 'approved',
              reviewed_by: user.id,
              reviewed_at: new Date().toISOString(),
              admin_notes: 'Auto-approved for completed order'
            })
            .eq('id', payout.id)

          if (approveError) {
            throw new Error(`Failed to approve payout: ${approveError.message}`)
          }

          // Process Stripe transfer
          const transfer = await stripe.transfers.create({
            amount: Math.round(payout.amount * 100), // Convert dollars to cents
            currency: 'usd',
            destination: payout.profiles.stripe_account_id,
            description: `Auto-payout for order ${payout.order_id.slice(0, 8)} - ${payout.profiles.full_name}`,
            metadata: {
              payout_request_id: payout.id,
              order_id: payout.order_id,
              kol_id: payout.kol_id,
              kol_username: payout.profiles.username,
              auto_processed: 'true'
            }
          })

          // Update payout with transfer details
          const { error: transferError } = await supabase
            .from('payout_requests')
            .update({
              status: 'completed',
              stripe_transfer_id: transfer.id,
              transfer_completed_at: new Date().toISOString()
            })
            .eq('id', payout.id)

          if (transferError) {
            throw new Error(`Failed to update transfer details: ${transferError.message}`)
          }

          console.log(`✅ Auto-processed payout ${payout.id} for ${payout.profiles.username} - $${payout.amount}`)

          return {
            payoutId: payout.id,
            status: 'completed',
            transferId: transfer.id,
            amount: payout.amount,
            kolUsername: payout.profiles.username
          }

        } catch (error: any) {
          console.error(`❌ Failed to process payout ${payout.id}:`, error.message)
          
          // Mark as failed
          await supabase
            .from('payout_requests')
            .update({
              status: 'failed',
              admin_notes: `Auto-processing failed: ${error.message}`
            })
            .eq('id', payout.id)

          return {
            payoutId: payout.id,
            status: 'failed',
            error: error.message
          }
        }
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 'completed')
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'failed'))
    const skipped = results.filter(r => r.status === 'fulfilled' && r.value.status === 'skipped')

    return NextResponse.json({
      success: true,
      message: `Auto-processed ${successful.length} payouts`,
      summary: {
        total: pendingPayouts.length,
        successful: successful.length,
        failed: failed.length,
        skipped: skipped.length
      },
      results: results.map(r => r.status === 'fulfilled' ? r.value : { status: 'error', error: 'Promise rejected' })
    })

  } catch (error) {
    console.error('Auto-approval processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}