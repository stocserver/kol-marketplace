'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRole } from '@/contexts/RoleContext'

interface SponsorProfileProps {
  user: any
}

export default function SponsorProfile({ user }: SponsorProfileProps) {
  const [activeTab, setActiveTab] = useState('orders')
  const { theme } = useRole()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'revision':
        return 'bg-yellow-100 text-yellow-800'
      case 'disputed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      {/* Cover Photo & Profile Header */}
      <div className="relative">
        <div className="h-64 bg-gradient-to-r from-purple-500 to-pink-600 overflow-hidden">
          <img
            src={user.cover_image}
            alt="Cover"
            className="w-full h-full object-cover opacity-80"
          />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end space-x-6 pb-6">
              <div className="relative">
                <img
                  src={user.profile_image}
                  alt={user.full_name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                />
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              
              <div className="flex-1 text-white">
                <h1 className="text-3xl font-bold">{user.full_name}</h1>
                <p className="text-xl opacity-90">@{user.username}</p>
                <div className="flex items-center space-x-6 mt-2">
                  <div>{user.company_size}</div>
                  <div>{user.industry}</div>
                  {user.website && (
                    <a href={user.website} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
                      Website
                    </a>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                  Message
                </button>
                <button className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                  Follow
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* About */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
              <p className="text-gray-700 leading-relaxed mb-4">{user.bio}</p>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>Member since {new Date(user.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2v8h12V6H4z" clipRule="evenodd" />
                  </svg>
                  <span>Industry: {user.industry}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span>{user.company_size}</span>
                </div>
              </div>
            </div>

            {/* Campaign Stats */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{user.total_campaigns}</div>
                  <div className="text-sm text-gray-600">Total Campaigns</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">${user.total_spent.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Spent</div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{user.active_orders}</div>
                  <div className="text-sm text-gray-600">Active Orders</div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{user.completed_orders}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>
            </div>

            {/* Favorite KOLs */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Favorite KOLs</h3>
              <div className="space-y-3">
                {user.favorite_kols.map((kol: any) => (
                  <Link key={kol.id} href={`/profile/${kol.id}`}>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <img
                        src={kol.image}
                        alt={kol.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{kol.name}</div>
                        <div className="text-sm text-gray-600">@{kol.username}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {kol.followers >= 1000000 ? `${(kol.followers / 1000000).toFixed(1)}M` :
                           kol.followers >= 1000 ? `${(kol.followers / 1000).toFixed(0)}K` :
                           kol.followers} followers
                        </div>
                        <div className="text-xs text-gray-500">⭐ {kol.rating}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Tabs Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {['orders', 'campaigns'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>
              
              <div className="p-6">
                {activeTab === 'orders' && (
                  <div className="space-y-4">
                    {user.recent_orders.map((order: any) => (
                      <Link key={order.id} href={`/orders/${order.id}`}>
                        <div className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <img
                                src={order.kol_image}
                                alt={order.kol_name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                              <div>
                                <h4 className="font-semibold text-gray-900">{order.gig_title}</h4>
                                <p className="text-sm text-gray-600">with {order.kol_name}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                  <span>Ordered: {new Date(order.date).toLocaleDateString()}</span>
                                  <span>Delivery: {new Date(order.delivery_date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">${order.amount}</div>
                              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(order.status)}`}>
                                {order.status.replace('_', ' ').toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                    
                    <div className="text-center py-6">
                      <button className={`${theme.primary} ${theme.primaryHover} text-white px-6 py-2 rounded-lg font-semibold`}>
                        View All Orders
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'campaigns' && (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Campaign Analytics Coming Soon</h3>
                    <p className="text-gray-600">Track your campaign performance, ROI, and engagement metrics.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}