'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useOrders } from '@/hooks/useOrders'

interface SponsorDashboardProps {
  user: any
}

export default function SponsorDashboard({ user }: SponsorDashboardProps) {
  const [activeTab, setActiveTab] = useState('orders')
  const { sponsorOrders, loading: ordersLoading } = useOrders()
  
  // Calculate stats directly from the fetched orders (same source as the order list)
  const stats = {
    active: sponsorOrders.filter(order => 
      ['pending', 'paid', 'in_progress', 'delivered', 'submitted'].includes(order.status)
    ).length,
    completed: sponsorOrders.filter(order => 
      order.status === 'completed'
    ).length,
    total: sponsorOrders.length,
    totalSpent: sponsorOrders
      .filter(order => ['delivered', 'completed'].includes(order.status))
      .reduce((sum, order) => sum + (order.amount || 0), 0)
  }
  
  console.log('Sponsor Dashboard Stats:', {
    active: stats.active,
    completed: stats.completed,
    total: stats.total,
    totalSpent: stats.totalSpent,
    userStats: {
      active_orders: user.active_orders,
      completed_orders: user.completed_orders,
      total_orders: user.total_orders,
      total_spent: user.total_spent
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

  const getSponsorAction = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Confirm Order', action: 'confirm', color: 'bg-green-600 hover:bg-green-700' }
      case 'submitted':
        return { text: 'Review & Approve', action: 'review', color: 'bg-blue-600 hover:bg-blue-700' }
      case 'revision':
        return { text: 'Request Revision', action: 'revise', color: 'bg-orange-600 hover:bg-orange-700' }
      case 'in_progress':
        return { text: 'In Progress', action: 'waiting', color: 'bg-gray-400', disabled: true }
      case 'completed':
        return { text: 'Leave Review', action: 'review', color: 'bg-purple-600 hover:bg-purple-700' }
      default:
        return { text: 'View Details', action: 'view', color: 'bg-gray-600 hover:bg-gray-700' }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.full_name}! 💼</h1>
            <p className="text-gray-600 mt-2">Manage and track your orders</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">@{user.username}</p>
            <p className="text-sm text-gray-500">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                💼 Sponsor Mode
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 mb-8 text-white">
        <h2 className="text-xl font-semibold mb-4">🚀 Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/orders" className="bg-white/20 hover:bg-white/30 rounded-lg p-4 transition-colors group">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110-2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Manage Orders</p>
                <p className="text-sm opacity-80">Track progress</p>
              </div>
            </div>
          </Link>

          <Link href="/profile" className="bg-white/20 hover:bg-white/30 rounded-lg p-4 transition-colors group">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Edit Profile</p>
                <p className="text-sm opacity-80">Company details</p>
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
                <p className="font-medium">Payment Settings</p>
                <p className="text-sm opacity-80">Billing & payment methods</p>
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
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{ordersLoading ? '...' : stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-semibold text-gray-900">{ordersLoading ? '...' : `$${stats.totalSpent.toLocaleString()}`}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {['orders', 'analytics', 'kols'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'kols' ? 'Favorite KOLs' : tab}
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
                    <option>Pending</option>
                    <option>Confirmed</option>
                    <option>In Progress</option>
                    <option>Submitted</option>
                    <option>Completed</option>
                  </select>
                  <Link href="/gigs">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold text-sm">
                      Browse KOLs
                    </button>
                  </Link>
                </div>
              </div>

              {ordersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading orders...</p>
                </div>
              ) : sponsorOrders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600 mb-6">Browse KOL services and place your first order!</p>
                  <Link href="/marketplace" className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold">
                    Browse Services
                  </Link>
                </div>
              ) : sponsorOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <img
                          src={order.kol.avatar_url || '/api/placeholder/48/48'}
                          alt={order.kol.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{order.gig.title}</h4>
                          <p className="text-gray-600">KOL: {order.kol.full_name} (@{order.kol.username})</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>Order #{order.id.slice(0, 8)}</span>
                            <span>Ordered: {new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {order.deliverables && (
                        <div className="bg-blue-50 rounded-lg p-4 mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">Latest Deliverables:</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {order.deliverables.map((file: any, index: number) => (
                              <div key={index} className="bg-white rounded p-2 text-center">
                                <div className="w-12 h-12 bg-blue-100 rounded mx-auto mb-2 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <p className="text-xs text-gray-600 truncate">{file.name}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-lg font-bold text-gray-900">${order.amount}</span>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-6">
                      {(() => {
                        const action = getSponsorAction(order.status)
                        return (
                          <button
                            disabled={action.disabled}
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


          {activeTab === 'analytics' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Total Reach</h4>
                  <p className="text-2xl font-bold text-blue-900">{user.analytics.total_reach.toLocaleString()}</p>
                  <p className="text-sm text-blue-600">Across all orders</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Avg. Engagement</h4>
                  <p className="text-2xl font-bold text-green-900">{user.analytics.avg_engagement}%</p>
                  <p className="text-sm text-green-600">+2.3% vs last month</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-800 mb-2">ROI</h4>
                  <p className="text-2xl font-bold text-purple-900">{user.analytics.roi}x</p>
                  <p className="text-sm text-purple-600">Return on investment</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Cost per 1K</h4>
                  <p className="text-2xl font-bold text-yellow-900">${user.analytics.cpm}</p>
                  <p className="text-sm text-yellow-600">Average CPM</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Top Performing KOLs</h4>
                <div className="space-y-3">
                  {user.analytics.top_kols.map((kol: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-white rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <img src={kol.image} alt={kol.name} className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="font-medium text-gray-900">{kol.name}</p>
                          <p className="text-sm text-gray-600">{kol.platform}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{kol.engagement}% engagement</p>
                        <p className="text-sm text-gray-600">{kol.reach.toLocaleString()} reach</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kols' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Favorite KOLs</h3>
                <Link href="/gigs">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold text-sm">
                    Discover KOLs
                  </button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {user.favorite_kols.map((kol: any) => (
                  <Link key={kol.id} href={`/profile/${kol.username || kol.id}`}>
                    <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center space-x-4 mb-4">
                        <img
                          src={kol.image}
                          alt={kol.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{kol.name}</h4>
                          <p className="text-gray-600">@{kol.username}</p>
                          <div className="flex items-center space-x-1 text-sm text-yellow-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>{kol.rating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Followers:</span>
                          <span>{kol.followers >= 1000000 ? `${(kol.followers / 1000000).toFixed(1)}M` : 
                                kol.followers >= 1000 ? `${(kol.followers / 1000).toFixed(0)}K` : kol.followers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Starting at:</span>
                          <span className="font-medium">${kol.starting_price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Orders completed:</span>
                          <span>{kol.completed_orders}</span>
                        </div>
                      </div>

                      <button className="w-full mt-4 bg-purple-100 hover:bg-purple-200 text-purple-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        View Profile
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}