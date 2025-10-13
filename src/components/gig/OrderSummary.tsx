'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRole } from '@/contexts/RoleContext'
import { createClient } from '@/lib/supabase/client'

interface OrderSummaryProps {
  gig: {
    id: string
    price: number
    delivery_days: number
    fast_delivery: boolean
    fast_delivery_days?: number
    kol: {
      id: string
      username: string
      full_name: string
    }
  }
}

export default function OrderSummary({ gig }: OrderSummaryProps) {
  const [fastDelivery, setFastDelivery] = useState(false)
  const [specialRequirements, setSpecialRequirements] = useState('')
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null)
  const [isOwnGig, setIsOwnGig] = useState(false)
  const { theme } = useRole()
  const router = useRouter()
  const supabase = createClient()

  const basePrice = gig.price

  // Calculate Stripe fee (2.9% + $0.30)
  const stripeFee = Math.round((basePrice * 0.029 + 0.30) * 100) / 100

  // Calculate 1% service fee
  const serviceFee = Math.round(basePrice * 0.01 * 100) / 100

  // Total amount to charge
  const totalPrice = basePrice + stripeFee + serviceFee

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        // Check if this is the user's own gig
        setIsOwnGig(user.id === gig.kol.id)
      }
    }
    
    checkUser()
  }, [gig.kol.id, supabase])

  const handleOrderNow = () => {
    if (isOwnGig) {
      alert('You cannot purchase your own gig!')
      return
    }
    
    if (!currentUser) {
      router.push('/login')
      return
    }
    
    // Redirect to real checkout page with order data
    const checkoutParams = new URLSearchParams({
      fastDelivery: fastDelivery.toString(),
      requirements: specialRequirements
    })
    
    router.push(`/checkout/${gig.id}?${checkoutParams.toString()}`)
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg border">
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-gray-900">
          ${totalPrice}
        </div>
      </div>

      {/* Delivery Time */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Delivery Time</h3>
        <div className="p-3 border rounded-lg bg-gray-50">
          <div className="font-medium text-gray-900">Standard Delivery</div>
          <div className="text-sm text-gray-600">{gig.delivery_days} days</div>
        </div>
      </div>

      {/* Special Requirements */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Special Requirements (Optional)
        </label>
        <textarea
          value={specialRequirements}
          onChange={(e) => setSpecialRequirements(e.target.value)}
          placeholder="Any specific requirements or details for your order..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Price Breakdown */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Gig price</span>
            <span className="text-gray-900">${basePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Processing fee</span>
            <span className="text-gray-900">${stripeFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Service fee (1%)</span>
            <span className="text-gray-900">${serviceFee.toFixed(2)}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between font-semibold text-base">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <span className="font-medium">Refund policy:</span> If order is cancelled via dispute, you'll receive ${basePrice.toFixed(2)} back (base price only).
          </p>
        </div>
      </div>

      {/* Order Button */}
      <button
        onClick={handleOrderNow}
        disabled={isOwnGig}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
          isOwnGig 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : `${theme.primary} ${theme.primaryHover} text-white`
        }`}
      >
        {isOwnGig ? 'This is Your Gig' : 'Continue to Payment'}
      </button>

      {/* KOL Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            <div className="flex items-center space-x-1 mb-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Avg. response time: Within 24 hours</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>Expected delivery: {gig.delivery_days} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}