'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRole } from '@/contexts/RoleContext'
import { createClient } from '@/lib/supabase/client'
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector'
import OrderReview from '@/components/checkout/OrderReview'
import StripeProvider from '@/components/checkout/StripeProvider'
import StripePaymentForm from '@/components/checkout/StripePaymentForm'

// Mock gig data (same as gig detail page)
const mockGig = {
  id: '1',
  title: 'Instagram Reel + Story Package - Fashion Content Creation',
  price: 299,
  delivery_days: 3,
  fast_delivery: true,
  fast_delivery_days: 1,
  preview_image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
  kol: {
    id: 'kol1',
    username: 'fashionista_emma',
    full_name: 'Emma Rodriguez',
    profile_image: 'https://images.unsplash.com/photo-1494790108755-2616b352caf1?w=150',
  }
}

interface CheckoutData {
  specialRequirements: string
  paymentMethod: string
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const [gig, setGig] = useState<any>(null)
  const [gigLoading, setGigLoading] = useState(true)
  const supabase = createClient()
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    specialRequirements: '',
    paymentMethod: 'card'
  })
  const [step, setStep] = useState(1) // 1: Review, 2: Payment, 3: Processing
  const [processing, setProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [clientSecret, setClientSecret] = useState<string>('')
  const [orderId, setOrderId] = useState<string>('')
  const { theme } = useRole()

  useEffect(() => {
    const loadGigAndCheckoutData = async () => {
      try {
        // Get gig data from database
        const { data: gigData, error: gigError } = await supabase
          .from('gigs')
          .select(`
            *,
            kol:profiles!gigs_kol_id_fkey(
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('id', params.gigId)
          .eq('is_active', true)
          .eq('approval_status', 'approved')
          .single()
        
        if (gigError || !gigData) {
          console.error('Error loading gig:', gigError)
          router.push('/marketplace')
          return
        }
        
        setGig({
          ...gigData,
          preview_image_url: gigData.image_urls?.[0] || gigData.preview_image_url || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500'
        })
        
        // Get checkout data from URL params
        const urlParams = new URLSearchParams(window.location.search)
        const requirements = urlParams.get('requirements') || ''
        
        setCheckoutData({
          specialRequirements: requirements,
          paymentMethod: 'card'
        })
        
      } catch (error) {
        console.error('Error loading checkout data:', error)
        router.push('/marketplace')
      } finally {
        setGigLoading(false)
      }
    }

    loadGigAndCheckoutData()
  }, [params.gigId, router, supabase])

  const basePrice = gig?.price || 0
  const totalPrice = basePrice
  
  if (gigLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!gig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Gig not found</h1>
          <p className="text-gray-600 mb-6">The gig you're trying to purchase is no longer available.</p>
          <button
            onClick={() => router.push('/marketplace')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Browse Marketplace
          </button>
        </div>
      </div>
    )
  }

  const handleCreateOrder = async () => {
    setProcessing(true)
    setPaymentError('')
    setStep(3)

    try {
      // Create order and get Stripe client secret
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gigId: gig.id,
          requirements: checkoutData.specialRequirements || null
        }),
      })

      const result = await response.json()

      if (response.ok && result.orderId && result.clientSecret) {
        console.log('Order created:', result)
        setOrderId(result.orderId)
        setClientSecret(result.clientSecret)
        setStep(2) // Go to Stripe payment step
      } else {
        setPaymentError(result.error || 'Order creation failed. Please try again.')
        setStep(1)
      }
    } catch (error) {
      console.error('Order creation error:', error)
      setPaymentError('Something went wrong. Please try again.')
      setStep(1)
    }

    setProcessing(false)
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Update order status to paid
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          stripe_payment_intent_id: paymentIntentId
        })
        .eq('id', orderId)

      if (updateError) {
        console.error('Error updating order status:', updateError)
        setPaymentError('Payment succeeded but order update failed. Please contact support.')
        return
      }

      // Redirect to order page
      router.push(`/orders/${orderId}?success=true`)
    } catch (error) {
      console.error('Error updating order:', error)
      setPaymentError('Payment succeeded but order update failed. Please contact support.')
    }
  }

  const handlePaymentError = (error: string) => {
    setPaymentError(error)
    setStep(2) // Stay on payment step
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <OrderReview
            gig={gig}
            checkoutData={checkoutData}
            onDataChange={setCheckoutData}
            totalPrice={totalPrice}
            basePrice={basePrice}
            onContinue={handleCreateOrder}
          />
        )
      
      case 2:
        return clientSecret ? (
          <StripeProvider clientSecret={clientSecret}>
            <StripePaymentForm
              totalPrice={totalPrice}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              processing={processing}
              setProcessing={setProcessing}
              onBack={() => setStep(1)}
            />
          </StripeProvider>
        ) : (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Preparing Payment</h2>
            <p className="text-gray-600">Setting up secure payment processing...</p>
          </div>
        )
      
      case 3:
        return (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-600">Please wait while we process your payment...</p>
            <div className="mt-6 bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                🔒 Your payment is secured with 256-bit SSL encryption
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step {step} of 3</span>
            <span className="text-sm text-gray-500">Secure Checkout</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="flex items-center space-x-4">
            <img
              src={gig.preview_image_url}
              alt={gig.title}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{gig.title}</h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <img
                    src={gig.kol.profile_image}
                    alt={gig.kol.full_name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span>@{gig.kol.username}</span>
                </div>
                <div>Delivery: {gig.delivery_days} days</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">${totalPrice}</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {renderStep()}
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Money Back Guarantee</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 8A8 8 0 11.01 8a8 8 0 0117.99 0zM9 15l4.5-4.5L12 9l-3 3-1.5-1.5L6 12l3 3z" clipRule="evenodd" />
              </svg>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}