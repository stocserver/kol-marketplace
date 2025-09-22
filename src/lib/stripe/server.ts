import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

// Create Stripe Connect account for KOLs
export async function createConnectAccount(email: string, country: string = 'US') {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })
    return account
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
    throw error
  }
}

// Create account link for onboarding
export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })
    return accountLink
  } catch (error) {
    console.error('Error creating account link:', error)
    throw error
  }
}

// Create payment intent for a gig purchase - charges full amount to platform
export async function createPaymentIntent(
  amount: number,
  kolAccountId?: string, // Optional - not needed for simple charge
  applicationFeeAmount?: number // Optional - calculated in DB instead
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents - full amount
      currency: 'usd',
      // No application_fee_amount or on_behalf_of - just charge to platform
      // Payouts will be handled separately via database calculations
    })
    return paymentIntent
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

// Get account details
export async function getAccountDetails(accountId: string) {
  try {
    const account = await stripe.accounts.retrieve(accountId)
    return account
  } catch (error) {
    console.error('Error getting account details:', error)
    throw error
  }
}

// Create refund for a payment
export async function createRefund(
  paymentIntentId: string,
  amount?: number, // Optional - partial refund amount in cents
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
) {
  try {
    const refundData: any = {
      payment_intent: paymentIntentId,
      reason: reason || 'requested_by_customer'
    }

    // If amount specified, do partial refund
    if (amount) {
      refundData.amount = Math.round(amount * 100) // Convert to cents
    }

    const refund = await stripe.refunds.create(refundData)
    return refund
  } catch (error) {
    console.error('Error creating refund:', error)
    throw error
  }
}