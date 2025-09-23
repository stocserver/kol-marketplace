import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion
})

export async function GET() {
  try {
    // Test if Connect is enabled by trying to list accounts
    const accounts = await stripe.accounts.list({ limit: 1 })
    
    return NextResponse.json({
      success: true,
      message: 'Stripe Connect is properly configured!',
      accountsFound: accounts.data.length,
      connectEnabled: true
    })

  } catch (error: unknown) {
    console.error('Stripe Connect test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      connectEnabled: false,
      helpUrl: 'https://dashboard.stripe.com/connect/overview'
    }, { status: 400 })
  }
}