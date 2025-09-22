'use client'

import { useState } from 'react'

interface Profile {
  id: string
  stripe_account_id?: string
  stripe_onboarding_complete?: boolean
  stripe_charges_enabled?: boolean
  stripe_payouts_enabled?: boolean
}

interface StripeConnectSectionProps {
  profile: Profile
  onStripeConnectUpdate: () => void
}

export default function StripeConnectSection({ profile, onStripeConnectUpdate }: StripeConnectSectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConnectStripe = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Stripe Connect account')
      }

      // Redirect to Stripe onboarding
      window.location.href = data.onboardingUrl
      onStripeConnectUpdate() // Notify parent component of status change
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  const getStripeStatus = () => {
    if (!profile.stripe_account_id) {
      return {
        status: 'not_connected',
        message: 'Connect with Stripe to receive payments',
        color: 'bg-gray-100 text-gray-800'
      }
    }

    if (!profile.stripe_onboarding_complete) {
      return {
        status: 'incomplete',
        message: 'Complete Stripe onboarding to receive payments',
        color: 'bg-yellow-100 text-yellow-800'
      }
    }

    if (!profile.stripe_charges_enabled || !profile.stripe_payouts_enabled) {
      return {
        status: 'pending',
        message: 'Stripe account under review',
        color: 'bg-blue-100 text-blue-800'
      }
    }

    return {
      status: 'complete',
      message: 'Ready to receive payments',
      color: 'bg-green-100 text-green-800'
    }
  }

  const stripeStatus = getStripeStatus()

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Payment Setup
          </h3>
          <div className="flex items-center space-x-3 mb-3">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${stripeStatus.color}`}>
              {stripeStatus.message}
            </span>
          </div>
          <p className="text-gray-600 text-sm">
            Connect your Stripe account to receive payments from customers.
          </p>
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>
        
        <div>
          {stripeStatus.status === 'not_connected' && (
            <button
              onClick={handleConnectStripe}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {isLoading ? 'Connecting...' : 'Connect Stripe'}
            </button>
          )}
          
          {stripeStatus.status === 'incomplete' && (
            <button
              onClick={handleConnectStripe}
              disabled={isLoading}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {isLoading ? 'Loading...' : 'Complete Setup'}
            </button>
          )}
          
          {(stripeStatus.status === 'pending' || stripeStatus.status === 'complete') && (
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Account ID: {profile.stripe_account_id?.substring(0, 12)}...
              </p>
              {stripeStatus.status === 'complete' && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ All set!
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}