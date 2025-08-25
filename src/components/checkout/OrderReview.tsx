interface OrderReviewProps {
  gig: any
  checkoutData: {
    fastDelivery: boolean
    specialRequirements: string
    paymentMethod: string
  }
  onDataChange: (data: any) => void
  totalPrice: number
  basePrice: number
  fastDeliveryPrice: number
  serviceFee: number
  onContinue: () => void
}

export default function OrderReview({ 
  gig, 
  checkoutData, 
  onDataChange, 
  totalPrice, 
  basePrice, 
  fastDeliveryPrice, 
  serviceFee, 
  onContinue 
}: OrderReviewProps) {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Order</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Order Details */}
        <div className="space-y-6">
          {/* Delivery Options */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Options</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="delivery"
                  checked={!checkoutData.fastDelivery}
                  onChange={() => onDataChange({ ...checkoutData, fastDelivery: false })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Standard Delivery</div>
                  <div className="text-sm text-gray-600">{gig.delivery_days} days • ${basePrice}</div>
                </div>
              </label>

              {gig.fast_delivery && (
                <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="delivery"
                    checked={checkoutData.fastDelivery}
                    onChange={() => onDataChange({ ...checkoutData, fastDelivery: true })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 flex items-center space-x-2">
                      <span>Express Delivery</span>
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">⚡ Fast</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {gig.fast_delivery_days} day • ${basePrice + fastDeliveryPrice}
                    </div>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Special Requirements */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Special Requirements
            </label>
            <textarea
              value={checkoutData.specialRequirements}
              onChange={(e) => onDataChange({ ...checkoutData, specialRequirements: e.target.value })}
              placeholder="Any specific requirements, brand guidelines, or details for your order..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-2">
              Be as detailed as possible to ensure the best results
            </p>
          </div>

          {/* Order Terms */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Order Terms</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Work will begin once payment is confirmed</li>
              <li>• You'll receive updates throughout the process</li>
              <li>• Revisions are included as specified in the gig</li>
              <li>• Final files will be delivered via the platform</li>
            </ul>
          </div>
        </div>

        {/* Right Column - Price Summary */}
        <div>
          <div className="bg-gray-50 rounded-lg p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Gig price</span>
                <span className="text-gray-900">${basePrice}</span>
              </div>
              
              {checkoutData.fastDelivery && (
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center space-x-1">
                    <span>Express delivery</span>
                    <span className="text-yellow-600">⚡</span>
                  </span>
                  <span className="text-gray-900">${fastDeliveryPrice}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Service fee (5%)</span>
                <span className="text-gray-900">${serviceFee}</span>
              </div>
              
              <hr className="my-3" />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${totalPrice}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={onContinue}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Continue to Payment
              </button>
              
              <p className="text-xs text-gray-500 text-center">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>

            {/* Delivery Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Expected delivery: {checkoutData.fastDelivery ? gig.fast_delivery_days : gig.delivery_days} days</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Includes {gig.revisions_included || 1} revision(s)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}