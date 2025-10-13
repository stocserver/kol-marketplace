'use client'

import { useState, useEffect } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import type { StripePaymentElement } from '@stripe/stripe-js'

interface StripePaymentFormProps {
  totalPrice: number
  onPaymentSuccess: (paymentIntentId: string) => void
  onPaymentError: (error: string) => void
  processing: boolean
  setProcessing: (processing: boolean) => void
  onBack: () => void
  returnUrl?: string
}

export default function StripePaymentForm({
  totalPrice,
  onPaymentSuccess,
  onPaymentError,
  processing,
  setProcessing,
  onBack,
  returnUrl
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string>('')
  const [paymentElement, setPaymentElement] = useState<StripePaymentElement | null>(null)

  useEffect(() => {
    if (elements) {
      const element = elements.getElement('payment')
      setPaymentElement(element)
    }
  }, [elements])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError('')

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Payment failed')
        setProcessing(false)
        return
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl || `${window.location.origin}/orders`,
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        setError(confirmError.message || 'Payment failed')
        onPaymentError(confirmError.message || 'Payment failed')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent.id)
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError('An unexpected error occurred')
      onPaymentError('An unexpected error occurred')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
        <button
          onClick={onBack}
          disabled={processing}
          className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Payment Form */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <PaymentElement
                  options={{
                    layout: 'tabs'
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!stripe || processing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                `Pay $${totalPrice}`
              )}
            </button>
          </form>
        </div>

        {/* Right Column - Payment Summary */}
        <div>
          <div className="bg-gray-50 rounded-lg p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>

            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-gray-900">${totalPrice}</div>
              <div className="text-sm text-gray-600">Total amount</div>
            </div>

            {/* Test Credentials Button - Only show in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        // Auto-fill using Stripe's test mode functionality
                        if (paymentElement) {
                          // Focus the payment element to trigger test mode
                          paymentElement.focus()

                          // Wait a bit then simulate keyboard input for test data
                          setTimeout(() => {
                            // Create and dispatch keyboard events for test card number
                            const testCardNumber = '4242424242424242'

                            // Dispatch events to simulate typing
                            testCardNumber.split('').forEach((char, index) => {
                              setTimeout(() => {
                                paymentElement.focus()
                                document.dispatchEvent(new KeyboardEvent('keydown', {
                                  key: char,
                                  code: `Digit${char}`,
                                  bubbles: true
                                }))
                              }, index * 50)
                            })

                            console.log('✅ Attempting to auto-fill test card data')
                            alert('✅ Auto-fill attempted!\n\nIf not filled automatically, manually enter:\nCard: 4242 4242 4242 4242\nExp: 12/25\nCVC: 123')
                          }, 100)
                        } else {
                          alert('⚠️ Payment element not ready. Please manually enter:\n\nCard: 4242 4242 4242 4242\nExp: 12/25\nCVC: 123')
                        }
                      } catch (err) {
                        console.error('Auto-fill error:', err)
                        alert('❌ Auto-fill failed. Please manually enter:\n\nCard: 4242 4242 4242 4242\nExp: 12/25\nCVC: 123')
                      }
                    }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>✅ Fill Test Data</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      alert('🧪 Stripe Test Cards:\n\n✅ Success: 4242 4242 4242 4242\n❌ Declined: 4000 0000 0000 0002\n⚠️ Requires Auth: 4000 0000 0000 3220\n\nExpiry: Any future date (12/25)\nCVC: Any 3 digits (123)\nZIP: Any 5 digits (12345)')
                    }}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-1.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>📊 Test Cards Info</span>
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-2 text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Your payment is protected by Stripe</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Full refund if you&apos;re not satisfied</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 8A8 8 0 11.01 8a8 8 0 0117.99 0zM9 15l4.5-4.5L12 9l-3 3-1.5-1.5L6 12l3 3z" clipRule="evenodd" />
                </svg>
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
