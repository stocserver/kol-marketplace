'use client'

import { useState, useEffect } from 'react'
import { useRole } from '@/contexts/RoleContext'
import { useRouter, useSearchParams } from 'next/navigation'

interface StripeAccount {
  connected: boolean
  account_id: string | null
  charges_enabled: boolean
  details_submitted: boolean
  requirements?: Record<string, unknown>
}

export default function PaymentSettingsPage() {
  const { currentRole } = useRole()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [connecting, setConnecting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stripeAccount, setStripeAccount] = useState<StripeAccount | null>(null)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const isKOL = currentRole === 'kol'
  const isSponsor = currentRole === 'sponsor'

  useEffect(() => {
    loadStripeStatus()
    
    // Handle return from Stripe onboarding
    const success = searchParams.get('success')
    const refresh = searchParams.get('refresh')
    
    if (success === 'true') {
      setError('')
      setTimeout(() => loadStripeStatus(), 1000) // Give Stripe time to update
    }
    if (refresh === 'true') {
      loadStripeStatus()
    }
  }, [searchParams])

  const loadStripeStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stripe/connect/status')
      const data = await response.json()
      
      if (response.ok) {
        setStripeAccount(data)
      } else {
        setError(data.error || 'Failed to load Stripe status')
      }
    } catch (err) {
      setError('Failed to load Stripe status')
      console.error('Stripe status error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStripeConnectExpress = async () => {
    setConnecting(true)
    setError('')
    
    try {
      // Use mock endpoints for development (switch to real endpoints when Stripe Connect is enabled)
      const useMock = false // Set to true if you need to use mock mode
      const createEndpoint = useMock ? '/api/stripe/connect/create-mock' : '/api/stripe/connect/create'
      
      // First create/get Stripe account
      const createResponse = await fetch(createEndpoint, {
        method: 'POST'
      })
      
      const createData = await createResponse.json()
      
      if (!createResponse.ok) {
        throw new Error(createData.error)
      }
      
      // If account needs onboarding, redirect to Stripe
      if (!createData.charges_enabled || !createData.details_submitted) {
        const onboardEndpoint = useMock ? '/api/stripe/connect/onboard-mock' : '/api/stripe/connect/onboard'
        const onboardResponse = await fetch(onboardEndpoint, {
          method: 'POST'
        })
        
        const onboardData = await onboardResponse.json()
        
        if (onboardResponse.ok) {
          // Redirect to Stripe onboarding
          window.location.href = onboardData.onboarding_url
        } else {
          throw new Error(onboardData.error)
        }
      } else {
        // Account is already set up
        await loadStripeStatus()
      }
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect Stripe account')
      console.error('Stripe Connect error:', err)
    } finally {
      setConnecting(false)
    }
  }
  
  const handleStripeConnectOAuth = async () => {
    setConnecting(true)
    setError('')
    
    try {
      const response = await fetch('/api/stripe/connect/oauth', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Redirect to Stripe OAuth
        window.location.href = data.oauth_url
      } else {
        throw new Error(data.error)
      }
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start OAuth connection')
      console.error('Stripe OAuth error:', err)
    } finally {
      setConnecting(false)
    }
  }
  
  const handleManageAccount = async () => {
    try {
      setConnecting(true)
      const useMock = false // Set to true if you need to use mock mode  
      const onboardEndpoint = useMock ? '/api/stripe/connect/onboard-mock' : '/api/stripe/connect/onboard'
      const response = await fetch(onboardEndpoint, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        window.location.href = data.onboarding_url
      } else {
        setError(data.error || 'Failed to create management link')
      }
    } catch {
      setError('Failed to access account management')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isKOL ? 'Payout Settings' : 'Payment Settings'}
              </h1>
              <p className="text-gray-600 mt-2">
                {isKOL 
                  ? 'Connect your Stripe account to receive payments' 
                  : 'Stripe will handle your payments securely'
                }
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment settings...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            {/* Stripe Logo */}
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.479 9.883c-1.626-.604-2.512-1.067-2.512-1.803 0-.622.511-.977 1.423-.977 1.667 0 3.379.642 4.558 1.22l.666-4.111c-.935-.446-2.847-1.177-5.49-1.177-1.87 0-3.425.489-4.536 1.401-1.155.912-1.738 2.136-1.738 3.626 0 2.803 1.919 3.931 4.686 4.71 1.795.533 2.512 1.024 2.512 1.937 0 .756-.606 1.089-1.693 1.089-2.25 0-4.72-.936-6.26-1.849l-.665 4.19c1.646.758 3.98 1.615 7.28 1.615 2.002 0 3.614-.467 4.8-1.401 1.226-.956 1.848-2.225 1.848-3.78.001-2.847-2.027-4.074-4.878-4.69z"/>
              </svg>
            </div>

            {/* KOL View */}
            {isKOL && (
              <>
                {(stripeAccount?.connected && stripeAccount?.charges_enabled) || showPreview ? (
                  <>
                    {/* Connected State */}
                    <div className="mb-6">
                      {showPreview && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                          <p className="text-purple-800 text-sm font-medium text-center">
                            🔮 Preview Mode - This is how your page will look when Stripe is fully set up
                          </p>
                        </div>
                      )}
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-green-900 mb-2">Stripe Connected!</h2>
                      <p className="text-green-700">You&apos;re ready to receive payments</p>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-3">Account Status</h3>
                      <div className="space-y-2 text-sm text-green-800">
                        <div className="flex justify-between">
                          <span>Account ID:</span>
                          <span className="font-mono text-xs">
                            {showPreview ? 'acct_1PREVIEW123456789' : stripeAccount?.account_id}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Charges Enabled:</span>
                          <span className="text-green-600 font-semibold">✓ Yes</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Details Submitted:</span>
                          <span className="text-green-600 font-semibold">✓ Complete</span>
                        </div>
                        {showPreview && (
                          <div className="flex justify-between">
                            <span>Connection Type:</span>
                            <span className="text-blue-600 font-semibold">Preview Mode</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <button
                        onClick={handleManageAccount}
                        disabled={connecting || showPreview}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold"
                      >
                        {connecting ? 'Loading...' : 'Manage Account'}
                      </button>
                      
                      {showPreview && (
                        <button
                          onClick={() => setShowPreview(false)}
                          className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold"
                        >
                          Exit Preview Mode
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Not Connected State */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Stripe Account</h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Choose how you&apos;d like to connect your Stripe account to receive payments.
                    </p>
                    
                    <div className="space-y-4 mb-8 max-w-lg mx-auto">
                      {/* Option 1: I have a Stripe account */}
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-left">
                        <div className="flex items-center mb-3">
                          <svg className="w-6 h-6 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <h3 className="text-lg font-semibold text-blue-900">I already have a Stripe account</h3>
                        </div>
                        <p className="text-blue-800 text-sm mb-4">
                          Connect your existing Stripe account. You&apos;ll log in to authorize our platform.
                        </p>
                        <button
                          onClick={handleStripeConnectOAuth}
                          disabled={connecting}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2"
                        >
                          {connecting ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Connecting...</span>
                            </>
                          ) : (
                            <>
                              <span>Connect Existing Account</span>
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                      
                      {/* Divider */}
                      <div className="flex items-center">
                        <div className="flex-1 border-t border-gray-300"></div>
                        <span className="px-4 text-gray-500 text-sm">or</span>
                        <div className="flex-1 border-t border-gray-300"></div>
                      </div>
                      
                      {/* Option 2: Create new account */}
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-left">
                        <div className="flex items-center mb-3">
                          <svg className="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg>
                          <h3 className="text-lg font-semibold text-green-900">Create a new Stripe account</h3>
                        </div>
                        <p className="text-green-800 text-sm mb-4">
                          Set up a new Stripe Express account. Perfect if you&apos;re new to Stripe.
                        </p>
                        <button
                          onClick={handleStripeConnectExpress}
                          disabled={connecting}
                          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2"
                        >
                          {connecting ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Setting up...</span>
                            </>
                          ) : (
                            <>
                              <span>Create New Account</span>
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Preview Button */}
                    <div className="mb-6">
                      <button
                        onClick={() => setShowPreview(true)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>👀 Preview Connected State</span>
                      </button>
                      <p className="text-center text-xs text-gray-500 mt-2">
                        See how it looks when your Stripe account is fully set up
                      </p>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div className="text-left">
                          <h3 className="text-sm font-medium text-green-900">Why Stripe?</h3>
                          <ul className="text-sm text-green-700 mt-2 space-y-1">
                            <li>• Instant payouts to your bank account</li>
                            <li>• Handles all tax forms automatically</li>
                            <li>• Industry-leading security</li>
                            <li>• Used by millions of businesses worldwide</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Sponsor View */}
            {isSponsor && (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Powered by Stripe</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  All payments are processed securely through Stripe. 
                  You&apos;ll add your payment method during checkout when hiring KOLs.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works:</h3>
                  <div className="text-left space-y-2 text-blue-800">
                    <div className="flex items-center space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                      <span>Browse and select a KOL service</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                      <span>Add your payment method at checkout</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                      <span>Payment is held securely until work is completed</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            🔒 All payment information is encrypted and processed securely by Stripe.
            We never store your payment details.
          </p>
        </div>

        {/* Test Mode Notice */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Stripe Connect Enabled - Test Mode
          </div>
        </div>
      </div>
    </div>
  )
}