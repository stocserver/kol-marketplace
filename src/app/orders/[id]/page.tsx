'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useRole } from '@/contexts/RoleContext'
import OrderTimeline from '@/components/order/OrderTimeline'
import OrderChat from '@/components/order/OrderChat'

// Mock order statuses for the workflow
const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed', 
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  REVISION: 'revision',
  DISPUTED: 'disputed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export default function OrderDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useRole()
  const isSuccess = searchParams.get('success') === 'true'

  useEffect(() => {
    // Load mock order from localStorage
    const mockOrders = JSON.parse(localStorage.getItem('mockOrders') || '[]')
    const foundOrder = mockOrders.find((o: any) => o.id === params.id)
    
    if (foundOrder) {
      // Add mock gig data
      const orderWithGig = {
        ...foundOrder,
        gig: {
          title: 'Instagram Reel + Story Package - Fashion Content Creation',
          platform: 'Instagram',
          deliveryDays: foundOrder.fastDelivery ? 1 : 3,
          seller: {
            username: 'fashionista_emma',
            full_name: 'Emma Rodriguez',
            profile_image: 'https://images.unsplash.com/photo-1494790108755-2616b352caf1?w=150'
          }
        },
        activities: [
          {
            id: 1,
            type: 'order_created',
            title: 'Order Created',
            description: 'Your order has been placed successfully',
            timestamp: foundOrder.createdAt,
            status: 'completed'
          },
          {
            id: 2,
            type: 'payment_received',
            title: 'Payment Confirmed',
            description: 'Payment has been processed and confirmed',
            timestamp: foundOrder.createdAt,
            status: 'completed'
          },
          {
            id: 3,
            type: 'work_started',
            title: 'Work Started',
            description: 'KOL has started working on your content',
            timestamp: null,
            status: foundOrder.status === 'confirmed' ? 'pending' : 'completed'
          },
          {
            id: 4,
            type: 'work_submitted',
            title: 'Work Submitted',
            description: 'KOL has submitted the deliverables for review',
            timestamp: null,
            status: 'pending'
          },
          {
            id: 5,
            type: 'order_completed',
            title: 'Order Completed',
            description: 'Order has been completed successfully',
            timestamp: null,
            status: 'pending'
          }
        ]
      }
      setOrder(orderWithGig)
    }
    
    setLoading(false)
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Order not found</h1>
          <p className="text-gray-600 mt-2">The order you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Banner */}
      {isSuccess && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-green-900">Order Confirmed!</h2>
              <p className="text-green-700">Your payment has been processed and the KOL has been notified.</p>
            </div>
          </div>
        </div>
      )}

      {/* Order Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Order #{order.id.split('_')[1]}
            </h1>
            <p className="text-gray-600 mb-4">{order.gig.title}</p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <img
                  src={order.gig.seller.profile_image}
                  alt={order.gig.seller.full_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span>@{order.gig.seller.username}</span>
              </div>
              <div>Platform: {order.gig.platform}</div>
              <div>Delivery: {order.gig.deliveryDays} days</div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">${order.amount}</div>
            <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
              order.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              order.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {order.status.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Order Timeline */}
        <div className="lg:col-span-2">
          <OrderTimeline activities={order.activities} />
        </div>

        {/* Right Column - Chat & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <OrderChat orderId={order.id} sellerId={order.sellerId} />
          
          {/* Order Actions */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-4">Order Actions</h3>
            
            <div className="space-y-3">
              {order.status === 'submitted' && (
                <>
                  <button className={`w-full ${theme.primary} ${theme.primaryHover} text-white py-2 px-4 rounded-lg font-medium`}>
                    Approve Work
                  </button>
                  <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg font-medium">
                    Request Revision
                  </button>
                </>
              )}
              
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium">
                Download Files
              </button>
              
              <button className="w-full bg-red-100 hover:bg-red-200 text-red-700 py-2 px-4 rounded-lg font-medium">
                Open Dispute
              </button>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date:</span>
                <span className="text-gray-900">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Date:</span>
                <span className="text-gray-900">
                  {new Date(order.deliveryDate).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Fast Delivery:</span>
                <span className="text-gray-900">{order.fastDelivery ? 'Yes' : 'No'}</span>
              </div>
              
              {order.specialRequirements && (
                <div>
                  <span className="text-gray-600 block mb-1">Special Requirements:</span>
                  <p className="text-gray-900 text-xs bg-gray-50 p-2 rounded">
                    {order.specialRequirements}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}