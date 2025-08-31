import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    const { payoutId } = await request.json()

    if (!payoutId) {
      return NextResponse.json({ error: 'Payout ID is required' }, { status: 400 })
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

    // Get payout request details
    const { data: payoutRequest, error: payoutError } = await supabase
      .from('payout_requests')
      .select(`
        *,
        profiles!payout_requests_kol_id_fkey (
          id,
          username,
          full_name,
          stripe_account_id
        )
      `)
      .eq('id', payoutId)
      .single()

    if (payoutError || !payoutRequest) {
      return NextResponse.json({ error: 'Payout request not found' }, { status: 404 })
    }

    // Check if payout is in approved status
    if (payoutRequest.status !== 'approved') {
      return NextResponse.json({ error: 'Payout request must be approved first' }, { status: 400 })
    }

    // Check if KOL has connected Stripe account
    if (!payoutRequest.profiles.stripe_account_id) {
      return NextResponse.json({ 
        error: 'KOL has not connected their Stripe account. Cannot process transfer.' 
      }, { status: 400 })
    }

    try {
      // Create Stripe transfer to KOL's connected account
      const transfer = await stripe.transfers.create({
        amount: Math.round(payoutRequest.amount * 100), // Convert dollars to cents
        currency: 'usd',
        destination: payoutRequest.profiles.stripe_account_id,
        description: `Payout for order ${payoutRequest.order_id.slice(0, 8)} - ${payoutRequest.profiles.full_name}`,
        metadata: {
          payout_request_id: payoutRequest.id,
          order_id: payoutRequest.order_id,
          kol_id: payoutRequest.kol_id,
          kol_username: payoutRequest.profiles.username
        }
      })

      console.log('✅ Stripe transfer created:', transfer.id)

      // Update payout request with transfer details
      const { data: updatedPayout, error: updateError } = await supabase
        .from('payout_requests')
        .update({
          status: 'completed',
          stripe_transfer_id: transfer.id,
          transfer_completed_at: new Date().toISOString()
        })
        .eq('id', payoutId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating payout request after transfer:', updateError)
        // Transfer was successful but DB update failed - this needs manual intervention
        return NextResponse.json({
          success: true,
          warning: 'Transfer completed but failed to update database. Manual update required.',
          transfer: {
            id: transfer.id,
            amount: transfer.amount,
            destination: transfer.destination
          }
        })
      }

      console.log(`✅ Payout ${payoutId} transferred successfully to ${payoutRequest.profiles.username}`)

      return NextResponse.json({
        success: true,
        message: 'Payout transferred successfully',
        transfer: {
          id: transfer.id,
          amount: transfer.amount,
          destination: transfer.destination,
          description: transfer.description
        },
        payout: updatedPayout
      })

    } catch (stripeError: any) {
      console.error('Stripe transfer error:', stripeError)
      
      // Update payout status to failed
      await supabase
        .from('payout_requests')
        .update({
          status: 'failed',
          admin_notes: `Transfer failed: ${stripeError.message}`
        })
        .eq('id', payoutId)

      return NextResponse.json({
        error: 'Transfer failed',
        details: stripeError.message
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Transfer processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get transfer status from Stripe
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transferId = searchParams.get('transferId')

    if (!transferId) {
      return NextResponse.json({ error: 'Transfer ID is required' }, { status: 400 })
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

    // Get transfer details from Stripe
    const transfer = await stripe.transfers.retrieve(transferId)

    return NextResponse.json({
      success: true,
      transfer: {
        id: transfer.id,
        amount: transfer.amount,
        currency: transfer.currency,
        created: transfer.created,
        destination: transfer.destination,
        description: transfer.description,
        metadata: transfer.metadata
      }
    })

  } catch (error) {
    console.error('Transfer status check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}