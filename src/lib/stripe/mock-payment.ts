// Mock Stripe Payment System
// This simulates the real Stripe payment flow for testing UI
// Keep the same function names and structure as real Stripe implementation

interface PaymentData {
  amount: number
  gigId: string
  sellerId: string
  fastDelivery: boolean
  specialRequirements: string
}

interface PaymentResult {
  success: boolean
  orderId?: string
  paymentIntentId?: string
  error?: string
}

// Mock payment processing - simulates Stripe's createPaymentIntent
export const mockStripePayment = async (paymentData: PaymentData): Promise<PaymentResult> => {
  console.log('🔄 Mock Stripe Payment Processing...')
  console.log('Payment Data:', paymentData)

  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Generate mock order ID and payment intent ID
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Simulate different outcomes based on amount (for testing)
  const random = Math.random()
  
  if (random < 0.9) {
    // 90% success rate
    console.log('✅ Mock Payment Successful!')
    console.log('Order ID:', orderId)
    console.log('Payment Intent ID:', paymentIntentId)
    
    // Store mock order in localStorage for testing
    const mockOrder = {
      id: orderId,
      gigId: paymentData.gigId,
      sellerId: paymentData.sellerId,
      buyerId: 'current_user_id', // Would be from auth
      amount: paymentData.amount,
      fastDelivery: paymentData.fastDelivery,
      specialRequirements: paymentData.specialRequirements,
      status: 'confirmed',
      paymentIntentId,
      createdAt: new Date().toISOString(),
      deliveryDate: new Date(Date.now() + (paymentData.fastDelivery ? 1 : 3) * 24 * 60 * 60 * 1000).toISOString()
    }
    
    // Store in localStorage for mock data persistence
    const existingOrders = JSON.parse(localStorage.getItem('mockOrders') || '[]')
    existingOrders.push(mockOrder)
    localStorage.setItem('mockOrders', JSON.stringify(existingOrders))
    
    return {
      success: true,
      orderId,
      paymentIntentId
    }
  } else {
    // 10% failure rate
    console.log('❌ Mock Payment Failed!')
    return {
      success: false,
      error: 'Your payment could not be processed. Please try again.'
    }
  }
}

// Mock function to create Stripe Connect account (for KOLs)
export const mockCreateStripeAccount = async (kolId: string) => {
  console.log('🔄 Mock Creating Stripe Connect Account for KOL:', kolId)
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const stripeAccountId = `acct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  console.log('✅ Mock Stripe Account Created:', stripeAccountId)
  
  return {
    success: true,
    accountId: stripeAccountId,
    onboardingUrl: `/stripe/onboarding/${stripeAccountId}` // Mock URL
  }
}

// Mock function to get payment status
export const mockGetPaymentStatus = async (paymentIntentId: string) => {
  console.log('🔍 Mock Checking Payment Status:', paymentIntentId)
  
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return {
    status: 'succeeded',
    amount: 299,
    currency: 'usd'
  }
}

// Mock webhook handler (for real implementation)
export const mockHandleStripeWebhook = async (signature: string) => {
  console.log('📨 Mock Stripe Webhook Received')
  console.log('Signature:', signature.substring(0, 20) + '...')
  
  // In real implementation, this would verify the webhook signature
  // and update order status based on payment events
  
  return { received: true }
}

// Export the same interfaces that real Stripe would use
export type { PaymentData, PaymentResult }