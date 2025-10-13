'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useOrders } from '@/hooks/useOrders'
import { useSearchParams } from 'next/navigation'

interface DashboardGig {
  id: string
  title: string
  price: number
  image?: string
  orders?: number
  rating?: number
  approval_status?: 'pending' | 'approved' | 'rejected'
  is_active?: boolean
  admin_notes?: string | null
}

export interface KOLUser {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  gigs?: DashboardGig[]
  [key: string]: unknown
}

interface KOLDashboardProps {
  user: KOLUser
}

export default function KOLDashboard({ user }: KOLDashboardProps) {
  const [activeTab, setActiveTab] = useState('orders')
  const { kolOrders, loading: ordersLoading, updateOrderStatus } = useOrders()
  const [payoutRequests, setPayoutRequests] = useState<{id: string; amount: number; status: string; order_id: string; requested_at: string; reviewed_at?: string; kol_message?: string; admin_notes?: string; stripe_transfer_id?: string; orders?: { gig?: { title?: string } }; [key: string]: unknown}[]>([])
  const [payoutLoading, setPayoutLoading] = useState(false)
  const searchParams = useSearchParams()
  
  // Calculate stats directly from the fetched orders (same source as the order list)
  const dashboardGigs = Array.isArray(user.gigs) ? (user.gigs as DashboardGig[]) : []

  const stats = {
    active: kolOrders.filter(order => 
      ['pending', 'paid', 'in_progress', 'delivered', 'submitted'].includes(order.status)
    ).length,
    completed: kolOrders.filter(order => 
      order.status === 'completed'
    ).length,
    total: kolOrders.length,
    totalEarnings: kolOrders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + (order.kol_earnings || 0), 0)
  }

  // Tab counts for quick visibility
  const u = user as { recent_transactions?: unknown; recent_messages?: unknown }
  const counts = {
    orders: kolOrders.length,
    gigs: dashboardGigs.length,
    earnings: Array.isArray(u.recent_transactions) ? u.recent_transactions.length : 0,
    payouts: payoutRequests.length,
    messages: Array.isArray(u.recent_messages) ? u.recent_messages.length : 0,
  }
  
  console.log('KOL Dashboard Stats:', {
    active: stats.active,
    completed: stats.completed,
    total: stats.total,
    totalEarnings: stats.totalEarnings,
    userStats: {
      active_orders: user.active_orders,
      completed_orders: user.completed_orders,
      total_orders: user.total_orders,
      total_earnings: user.total_earnings
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800'
      case 'revision':
        return 'bg-orange-100 text-orange-800'
      case 'submitted':
        return 'bg-purple-100 text-purple-800'
      case 'disputed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getGigApprovalBadge = (status?: DashboardGig['approval_status']) => {
    switch (status) {
      case 'approved':
        return { label: 'Approved', className: 'bg-green-50 text-green-700 border border-green-200' }
      case 'rejected':
        return { label: 'Rejected', className: 'bg-red-50 text-red-700 border border-red-200' }
      default:
        return { label: 'Pending Review', className: 'bg-yellow-50 text-yellow-700 border border-yellow-200' }
    }
  }

  const getGigActiveBadge = (isActive?: boolean) => {
    if (isActive === false) {
      return { label: 'Paused', className: 'bg-gray-100 text-gray-600 border border-gray-200' }
    }
    return { label: 'Active', className: 'bg-blue-50 text-blue-700 border border-blue-200' }
  }

  const getOrderAction = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { text: 'Start Work', action: 'start', color: 'bg-blue-600 hover:bg-blue-700' }
      case 'in_progress':
        return { text: 'Submit Deliverables', action: 'submit', color: 'bg-green-600 hover:bg-green-700' }
      case 'revision':
        return { text: 'Upload Revision', action: 'revise', color: 'bg-orange-600 hover:bg-orange-700' }
      case 'submitted':
        return { text: 'Awaiting Approval', action: 'waiting', color: 'bg-gray-400', disabled: true }
      case 'completed':
        return { text: 'Completed', action: 'completed', color: 'bg-gray-400', disabled: true }
      default:
        return { text: 'View Details', action: 'view', color: 'bg-gray-600 hover:bg-gray-700' }
    }
  }

  // Load payout requests
  useEffect(() => {
    if (activeTab === 'payouts') {
      loadPayoutRequests()
    }
  }, [activeTab])

  // Preload payout requests so the tab badge shows a count
  useEffect(() => {
    loadPayoutRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync active tab with URL query (?tab=...)
  useEffect(() => {
    const tab = searchParams?.get('tab')
    if (tab && ['orders','gigs','earnings','payouts','messages'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const loadPayoutRequests = async () => {
    setPayoutLoading(true)
    try {
      const response = await fetch('/api/payouts/request')
      const data = await response.json()
      if (data.success) {
        setPayoutRequests(data.payoutRequests)
      }
    } catch (error) {
      console.error('Error loading payout requests:', error)
    } finally {
      setPayoutLoading(false)
    }
  }

  const requestPayout = async (orderId: string, message?: string) => {
    try {
      const response = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, message })
      })
      
      const data = await response.json()
      if (data.success) {
        loadPayoutRequests() // Reload the list
        alert('Payout request submitted successfully!')
      } else {
        alert(data.error || 'Failed to request payout')
      }
    } catch (error) {
      console.error('Error requesting payout:', error)
      alert('Failed to request payout')
    }
  }

  const getPayoutStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.full_name}! 👋</h1>
            <p className="text-gray-600 mt-2">Manage your orders and track your performance</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">@{user.username}</p>
            <p className="text-sm text-gray-500">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                👑 KOL Mode
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-8 text-white">
        <h2 className="text-xl font-semibold mb-4">🚀 Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/profile" className="bg-white/20 hover:bg-white/30 rounded-lg p-4 transition-colors group">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Edit Profile</p>
                <p className="text-sm opacity-80">Update bio, platforms</p>
              </div>
            </div>
          </Link>

          <Link href="/gigs/create" className="bg-white/20 hover:bg-white/30 rounded-lg p-4 transition-colors group">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Create Gig</p>
                <p className="text-sm opacity-80">New service offering</p>
              </div>
            </div>
          </Link>

          <Link href="/gigs" className="bg-white/20 hover:bg-white/30 rounded-lg p-4 transition-colors group">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium">My Gigs</p>
                <p className="text-sm opacity-80">View & edit services</p>
              </div>
            </div>
          </Link>

          <Link href="/settings/payments" className="bg-white/20 hover:bg-white/30 rounded-lg p-4 transition-colors group">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Payout Settings</p>
                <p className="text-sm opacity-80">Bank & tax details</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{ordersLoading ? '...' : stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{ordersLoading ? '...' : stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rating</p>
              <p className="text-2xl font-semibold text-gray-900">{(typeof user.rating === 'number' ? user.rating.toFixed(1) : null) || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">{ordersLoading ? '...' : `$${stats.totalEarnings.toLocaleString()}`}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {['orders', 'gigs', 'earnings', 'payouts', 'messages'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'orders' && `Orders (${counts.orders})`}
                {tab === 'gigs' && `Gigs (${counts.gigs})`}
                {tab === 'earnings' && `Earnings (${counts.earnings})`}
                {tab === 'payouts' && `Payouts (${counts.payouts})`}
                {tab === 'messages' && `Messages (${counts.messages})`}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Order Management</h3>
                <div className="flex space-x-2">
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>All Status</option>
                    <option>Confirmed</option>
                    <option>In Progress</option>
                    <option>Submitted</option>
                    <option>Revision</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>

              {ordersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading orders...</p>
                </div>
              ) : kolOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600 mb-6">You haven&apos;t received any orders yet. Create some gigs to start earning!</p>
                  <Link href="/gigs/create" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold">
                    Create Your First Gig
                  </Link>
                </div>
              ) : kolOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <Image
                          src={order.sponsor.avatar_url || '/images/placeholder-avatar.svg'}
                          alt={order.sponsor.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                          width={48}
                          height={48}
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{order.gig.title}</h4>
                          <p className="text-gray-600">Client: {order.sponsor.full_name} (@{order.sponsor.username})</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>Order #{order.id.slice(0, 8)}</span>
                            <span>Ordered: {new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {order.requirements && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">Requirements:</h5>
                          <p className="text-gray-700 text-sm">{order.requirements}</p>
                        </div>
                      )}

                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-lg font-bold text-green-600">${order.kol_earnings}</span>
                        <span className="text-sm text-gray-500">($${order.amount} total)</span>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-6">
                      {(() => {
                        const action = getOrderAction(order.status)
                        return (
                          <button
                            disabled={action.disabled}
                            onClick={() => {
                              if (!action.disabled) {
                                const newStatus = action.action === 'start' ? 'in_progress' :
                                                action.action === 'submit' ? 'submitted' :
                                                action.action === 'revise' ? 'submitted' : order.status
                                if (newStatus !== order.status) {
                                  updateOrderStatus(order.id, newStatus as 'in_progress' | 'submitted')
                                }
                              }
                            }}
                            className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${action.color} ${action.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {action.text}
                          </button>
                        )
                      })()}
                      <Link href={`/orders/${order.id}`}>
                        <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'gigs' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Your Gigs</h3>
                <Link
                  href="/gigs/create"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold inline-flex items-center justify-center"
                >
                  Create New Gig
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardGigs.map((gig) => {
                  const approvalBadge = getGigApprovalBadge(gig.approval_status)
                  const activeBadge = getGigActiveBadge(gig.is_active)

                  return (
                    <div key={gig.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="relative w-full overflow-hidden bg-gray-200 pb-[56.25%]">
                        <Image src={gig.image || '/images/placeholder-gig.svg'} alt={gig.title} className="absolute inset-0 h-full w-full object-cover" fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${approvalBadge.className}`}>{approvalBadge.label}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${activeBadge.className}`}>{activeBadge.label}</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">{gig.title}</h4>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                          <span>${gig.price}</span>
                          <span>{gig.orders || 0} orders</span>
                        </div>
                        {gig.approval_status === 'rejected' && gig.admin_notes && (
                          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                            <strong>Admin feedback:</strong> {gig.admin_notes}
                          </div>
                        )}
                        <div className="flex space-x-2">
                          <Link
                            href={`/gigs/${gig.id}/edit`}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded text-sm font-medium inline-flex items-center justify-center"
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/gigs/${gig.id}`}
                            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded text-sm font-medium inline-flex items-center justify-center"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-green-800 mb-2">This Month</h4>
                    <p className="text-3xl font-bold text-green-900">${(typeof user.monthly_earnings === 'number' ? user.monthly_earnings : 0).toLocaleString()}</p>
                    <p className="text-sm text-green-600 mt-1">+15% from last month</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Pending</h4>
                    <p className="text-3xl font-bold text-blue-900">${(typeof user.pending_earnings === 'number' ? user.pending_earnings : 0).toLocaleString()}</p>
                    <p className="text-sm text-blue-600 mt-1">Available in 7 days</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-purple-800 mb-2">Total Lifetime</h4>
                    <p className="text-3xl font-bold text-purple-900">${(typeof user.total_earnings === 'number' ? user.total_earnings : 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Recent Transactions</h4>
                <div className="space-y-3">
                  {(Array.isArray(user.recent_transactions) ? user.recent_transactions : []).map((transaction: {amount: number; date: string; type: string; description?: string; status?: string}, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-600">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">+${transaction.amount}</p>
                        <p className="text-xs text-gray-500">{transaction.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payouts' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Payout Requests</h3>
                <p className="text-sm text-gray-600">Request payouts from completed orders</p>
              </div>

              {/* Completed orders eligible for payout */}
              <div className="mb-8">
                <h4 className="font-medium text-gray-900 mb-4">💰 Ready for Payout Request</h4>
                {(() => {
                  // Check for existing payout requests to determine eligibility
                  const eligibleOrders = kolOrders.filter(order => {
                    if (order.status !== 'completed') return false
                    
                    // Find existing payout request for this order
                    const existingRequest = payoutRequests.find(req => req.order_id === order.id)
                    
                    // Allow if no request exists, or if the last request was rejected
                    return !existingRequest || existingRequest.status === 'rejected'
                  })
                  
                  if (eligibleOrders.length === 0) {
                    return (
                      <div className="bg-gray-50 rounded-lg p-6 text-center">
                        <p className="text-gray-600">No completed orders ready for payout request</p>
                        <p className="text-sm text-gray-500 mt-1">Complete some orders to request payouts</p>
                      </div>
                    )
                  }

                  return (
                    <div className="grid gap-4">
                      {eligibleOrders.map((order) => (
                        <div key={order.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <Image
                                  src={order.sponsor.avatar_url || '/images/placeholder-avatar.svg'}
                                  alt={order.sponsor.full_name}
                                  className="w-8 h-8 rounded-full object-cover"
                                  width={32}
                                  height={32}
                                />
                                <div>
                                  <h5 className="font-medium text-gray-900">{order.gig.title}</h5>
                                  <p className="text-sm text-gray-600">Client: {order.sponsor.full_name}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="text-green-700 font-medium">Your earnings: ${order.kol_earnings}</span>
                                <span className="text-gray-600">Completed: {new Date(order.updated_at).toLocaleDateString()}</span>
                                {(() => {
                                  const existingRequest = payoutRequests.find(req => req.order_id === order.id)
                                  if (existingRequest?.status === 'rejected') {
                                    return (
                                      <span className="text-red-600 font-medium text-xs">Previous request rejected</span>
                                    )
                                  }
                                  return null
                                })()}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const existingRequest = payoutRequests.find(req => req.order_id === order.id)
                                const isReRequest = existingRequest?.status === 'rejected'
                                
                                if (isReRequest) {
                                  const retryMessage = prompt('Previous request was rejected. Add a message for this new request (optional):')
                                  requestPayout(order.id, retryMessage || undefined)
                                } else {
                                  requestPayout(order.id)
                                }
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              {(() => {
                                const existingRequest = payoutRequests.find(req => req.order_id === order.id)
                                return existingRequest?.status === 'rejected' ? 'Request Again' : 'Request Payout'
                              })()}
                            </button>
                          </div>
                        </div>
                      ))}
                </div>
                  )
                })()}
              </div>

              {/* Existing payout requests */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">📋 Your Payout Requests</h4>
                {payoutLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading payout requests...</p>
                  </div>
                ) : payoutRequests.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <p className="text-gray-600">No payout requests yet</p>
                    <p className="text-sm text-gray-500 mt-1">Request payouts from completed orders above</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payoutRequests.map((request) => (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div>
                                <h5 className="font-medium text-gray-900">{request.orders?.gig?.title || 'Unknown Gig'}</h5>
                                <p className="text-sm text-gray-600">
                                  Order #{request.order_id.slice(0, 8)} Ã¢â‚¬Â¢ Amount: ${request.amount / 100}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPayoutStatusColor(request.status)}`}>
                                {request.status.toUpperCase()}
                              </span>
                              <span className="text-gray-600">
                                Requested: {new Date(request.requested_at).toLocaleDateString()}
                              </span>
                              {request.reviewed_at && (
                                <span className="text-gray-600">
                                  Reviewed: {new Date(request.reviewed_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {request.kol_message && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                <span className="font-medium">Your message:</span> {request.kol_message}
                              </div>
                            )}
                            {request.admin_notes && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                <span className="font-medium">Admin notes:</span> {request.admin_notes}
                              </div>
                            )}
                          </div>
                          {request.status === 'completed' && request.stripe_transfer_id && (
                            <div className="text-right">
                              <span className="text-green-600 font-medium text-sm">Ã¢Å“â€¦ Transferred</span>
                              <p className="text-xs text-gray-500">Transfer ID: {request.stripe_transfer_id}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Messages</h3>
              <div className="space-y-4">
                {(Array.isArray(user.recent_messages) ? user.recent_messages : []).map((message: {id: string; from: string; preview: string; time: string; timestamp: string; order_id: string; sender_image?: string; sender_name?: string}) => (
                  <div key={message.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <Image
                      src={message.sender_image || '/images/placeholder-avatar.svg'}
                      alt={message.sender_name || 'User'}
                      className="w-10 h-10 rounded-full object-cover"
                      width={40}
                      height={40}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium text-gray-900">{message.sender_name}</h5>
                        <span className="text-sm text-gray-500">{new Date(message.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-700">{message.preview}</p>
                      <Link href={`/orders/${message.order_id}`}>
                        <span className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Conversation Ã¢â€ â€™</span>
                      </Link>
                    </div>
                  </div>
                ))}
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

