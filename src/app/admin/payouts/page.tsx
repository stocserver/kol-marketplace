'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PayoutRequest {
  id: string
  order_id: string
  kol_id: string
  amount: number
  platform_fee: number
  status: string
  requested_at: string
  kol_message?: string
  admin_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  stripe_transfer_id?: string
  orders: {
    id: string
    amount: number
    gigs: {
      title: string
    }
  }
  profiles: {
    id: string
    username: string
    full_name: string
    user_type: string
    avatar_url?: string
    stripe_account_id?: string
  }
}

export default function AdminPayoutsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const supabase = createClient()

  // Simple admin check
  const isAdmin = user?.email === 'admin@kolmarketplace.com' || 
                  user?.email?.endsWith('@admin.com') || 
                  user?.email === 'ivn.c.yu@gmail.com'
                  
  console.log('Admin page - user email:', user?.email)
  console.log('Admin page - isAdmin:', isAdmin)

  useEffect(() => {
    if (!user) return
    if (!isAdmin) {
      router.push('/dashboard')
      return
    }
    fetchPayoutRequests()
  }, [user, isAdmin, supabase, router])

  const fetchPayoutRequests = async () => {
    try {
      setLoading(true)
      
      console.log('Fetching payout requests...')
      const response = await fetch('/api/admin/payouts')
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      // Debug: Check each payout request structure
      if (data.payoutRequests) {
        data.payoutRequests.forEach((req: any, index) => {
          console.log(`Payout request ${index}:`, {
            id: req.id,
            kol_id: req.kol_id,
            hasKolData: !!req.profiles,
            kolData: req.profiles,
            hasOrderData: !!req.orders,
            orderData: req.orders
          })
        })
      }
      
      if (data.success) {
        setPayoutRequests(data.payoutRequests)
        console.log('Payout requests loaded:', data.payoutRequests.length)
        console.log('First payout request:', data.payoutRequests[0])
        
        // Debug: Check if KOL data is missing
        const requestsWithoutKol = data.payoutRequests.filter(req => !req.profiles)
        if (requestsWithoutKol.length > 0) {
          console.warn('Payout requests missing KOL data:', requestsWithoutKol)
        }
      } else {
        console.error('Error fetching payout requests:', data.error)
        console.error('Full response:', data)
      }
    } catch (error) {
      console.error('Error fetching payout requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePayoutStatus = async (payoutId: string, status: 'approved' | 'rejected', adminNotes?: string) => {
    try {
      const response = await fetch('/api/admin/payouts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          payoutId, 
          status, 
          adminNotes 
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Refresh the list
        await fetchPayoutRequests()
        alert(`Payout ${status} successfully!`)
      } else {
        console.error('Error updating payout status:', data.error)
        alert(data.error || 'Failed to update payout status')
      }
    } catch (error) {
      console.error('Error updating payout status:', error)
      alert('Failed to update payout status')
    }
  }

  const processStripeTransfer = async (payoutId: string) => {
    try {
      const confirmed = confirm('Are you sure you want to process this Stripe transfer? This cannot be undone.')
      if (!confirmed) return

      const response = await fetch('/api/admin/payouts/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId })
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchPayoutRequests()
        alert(`Transfer completed successfully! Transfer ID: ${data.transfer.id}`)
      } else {
        console.error('Transfer error:', data.error)
        alert(data.error || 'Transfer failed')
      }
    } catch (error) {
      console.error('Error processing transfer:', error)
      alert('Failed to process transfer')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredRequests = payoutRequests.filter(request => {
    if (filter === 'all') return true
    return request.status === filter
  })

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payout Management</h1>
              <p className="text-gray-600 mt-2">Review and approve KOL payout requests</p>
            </div>
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Admin Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Requests</h3>
            <p className="text-3xl font-bold text-gray-900">{payoutRequests.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {payoutRequests.filter(r => r.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Approved</h3>
            <p className="text-3xl font-bold text-blue-600">
              {payoutRequests.filter(r => r.status === 'approved').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Completed</h3>
            <p className="text-3xl font-bold text-green-600">
              {payoutRequests.filter(r => r.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Payout Requests</h2>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Payout Requests List */}
          <div className="divide-y divide-gray-200">
            {filteredRequests.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No payout requests found</h3>
                <p className="text-gray-600">
                  {filter === 'all' ? 'No payout requests have been submitted yet.' : `No ${filter} payout requests found.`}
                </p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div key={request.id} className="px-6 py-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* KOL Info */}
                      <div className="flex items-center space-x-3 mb-4">
                        <img
                          src={request.profiles?.avatar_url || '/api/placeholder/48/48'}
                          alt={request.profiles?.full_name || 'KOL'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {request.profiles?.full_name || 'Unknown KOL'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            @{request.profiles?.username || 'unknown'} • {request.profiles?.user_type || 'unknown'} user
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {request.profiles?.stripe_account_id ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Stripe Connected
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                ⚠ No Stripe Account
                              </span>
                            )}
                            {!request.profiles && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                ⚠ KOL Data Missing
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Gig:</span>
                            <p className="font-medium">{request.orders?.gigs?.title || 'Unknown Gig'}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Order ID:</span>
                            <p className="font-mono text-xs">{request.order_id}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Total Order Amount:</span>
                            <p className="font-medium">${request.orders?.amount || 0}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">KOL Payout Amount:</span>
                            <p className="font-medium text-green-600">${request.amount}</p>
                          </div>
                        </div>
                      </div>

                      {/* Request Info */}
                      <div className="flex items-center space-x-4 text-sm mb-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
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

                      {/* Messages */}
                      {request.kol_message && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm font-medium text-blue-900">KOL Message:</span>
                          <p className="text-sm text-blue-800 mt-1">{request.kol_message}</p>
                        </div>
                      )}

                      {request.admin_notes && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-900">Admin Notes:</span>
                          <p className="text-sm text-gray-700 mt-1">{request.admin_notes}</p>
                        </div>
                      )}

                      {request.stripe_transfer_id && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg">
                          <span className="text-sm font-medium text-green-900">Stripe Transfer:</span>
                          <p className="text-sm font-mono text-green-800 mt-1">{request.stripe_transfer_id}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-6">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              const notes = prompt('Admin notes (optional):')
                              updatePayoutStatus(request.id, 'approved', notes || undefined)
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const notes = prompt('Rejection reason (required):')
                              if (notes) {
                                updatePayoutStatus(request.id, 'rejected', notes)
                              }
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      
                      {request.status === 'approved' && (
                        <div className="space-y-2">
                          <button
                            onClick={() => processStripeTransfer(request.id)}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                          >
                            Process Transfer
                          </button>
                          <p className="text-xs text-blue-600 text-center">Ready for Stripe transfer</p>
                        </div>
                      )}

                      {request.status === 'completed' && (
                        <div className="text-center">
                          <p className="text-sm text-green-600 font-medium">✅ Transferred</p>
                        </div>
                      )}

                      {request.status === 'rejected' && (
                        <div className="text-center">
                          <p className="text-sm text-red-600 font-medium">❌ Rejected</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}