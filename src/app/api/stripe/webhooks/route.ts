import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')!
  
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  try {
    switch (event.type) {
      case 'account.updated':
        const account = event.data.object as Stripe.Account
        
        // Update profile with account capabilities
        await supabase
          .from('profiles')
          .update({
            stripe_onboarding_complete: account.details_submitted,
            stripe_charges_enabled: account.charges_enabled,
            stripe_payouts_enabled: account.payouts_enabled
          })
          .eq('stripe_account_id', account.id)
        
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update payment attempt status
        await supabase
          .from('payment_attempts')
          .update({ status: 'succeeded' })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        // Update order status and get order details
        const { data: paymentAttempt } = await supabase
          .from('payment_attempts')
          .select('order_id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (paymentAttempt) {
          const { data: updatedOrder } = await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('id', paymentAttempt.order_id)
            .select()
            .single()

          console.log(`💰 Payment succeeded for order ${paymentAttempt.order_id}`)
          console.log(`Platform is now holding $${updatedOrder?.amount} until KOL completes work`)
        }
        
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        
        // Update payment attempt status
        await supabase
          .from('payment_attempts')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', failedPayment.id)
        
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}