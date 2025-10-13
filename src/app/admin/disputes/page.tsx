'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Dispute {
  id: string
  order_id: string
  opened_by: string
  reason: string
  status: string
  resolution_type: string | null
  resolution_notes: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  order?: {
    id: string
    amount: number
    total_amount: number
    stripe_fee: number
    service_fee: number
    status: string
    gig?: {
      title: string
    }
    sponsor?: {
      username: string
      full_name: string
    }
    kol?: {
      username: string
      full_name: string
    }
  }
  opener?: {
    username: string
    full_name: string
  }
}

export default function AdminDisputesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [isResolving, setIsResolving] = useState(false)
  const supabase = createClient()

  const isAdmin = user?.email === 'admin@kolmarketplace.com' ||
                  user?.email?.endsWith('@admin.com') ||
                  user?.email === 'ivn.c.yu@gmail.com'

  useEffect(() => {
    if (!user) return
    if (!isAdmin) {
      router.push('/dashboard')
      return
    }
    fetchDisputes()
  }, [user, isAdmin, router])

  const fetchDisputes = async () => {
    try {
      setLoading(true)

      // Fetch disputes first (without joins to avoid foreign key name issues)
      const { data: disputesData, error: disputesError } = await supabase
        .from('disputes')
        .select('*')
        .order('created_at', { ascending: false })

      if (disputesError) throw disputesError

      // Then fetch related data for each dispute
      const enrichedDisputes = await Promise.all(
        (disputesData || []).map(async (dispute) => {
          try {
            // Fetch order
            const { data: order } = await supabase
              .from('orders')
              .select('id, amount, total_amount, stripe_fee, service_fee, status, sponsor_id, kol_id, gig_id')
              .eq('id', dispute.order_id)
              .single()

            let gig, sponsor, kol
            if (order) {
              // Fetch gig
              const gigData = await supabase.from('gigs').select('title').eq('id', order.gig_id).single()
              gig = gigData.data

              // Fetch sponsor
              const sponsorData = await supabase.from('profiles').select('username, full_name').eq('id', order.sponsor_id).single()
              sponsor = sponsorData.data

              // Fetch KOL
              const kolData = await supabase.from('profiles').select('username, full_name').eq('id', order.kol_id).single()
              kol = kolData.data
            }

            // Fetch opener
            const { data: opener } = await supabase
              .from('profiles')
              .select('username, full_name')
              .eq('id', dispute.opened_by)
              .single()

            return {
              ...dispute,
              order: order ? { ...order, gig, sponsor, kol } : null,
              opener
            }
          } catch (err) {
            console.error('Error enriching dispute:', err)
            return dispute
          }
        })
      )

      setDisputes(enrichedDisputes)
    } catch (error) {
      console.error('Error fetching disputes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (disputeId: string, resolutionType: 'continue' | 'cancel_refund') => {
    if (!resolutionNotes.trim()) {
      alert('Please provide resolution notes')
      return
    }

    if (resolutionType === 'cancel_refund') {
      const confirmed = confirm(
        'Are you sure you want to cancel this order and refund the sponsor?\n\n' +
        'The sponsor will receive back only the base order amount. ' +
        'The platform will keep the processing and service fees.'
      )
      if (!confirmed) return
    }

    try {
      setIsResolving(true)

      const response = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resolutionType,
          resolutionNotes: resolutionNotes.trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        alert(`Failed to resolve dispute: ${result.error || 'Unknown error'}`)
        return
      }

      alert(`Dispute resolved successfully!\n${result.message}`)
      setSelectedDispute(null)
      setResolutionNotes('')
      fetchDisputes()

    } catch (error) {
      console.error('Error resolving dispute:', error)
      alert('An unexpected error occurred.')
    } finally {
      setIsResolving(false)
    }
  }

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

  const openDisputes = disputes.filter(d => d.status === 'open' || d.status === 'under_review')
  const resolvedDisputes = disputes.filter(d => d.status === 'resolved')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Dispute Management</h1>
          <p className="text-gray-600 mt-2">Review and resolve order disputes</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Disputes</h3>
            <p className="text-3xl font-bold text-gray-900">{disputes.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Open Disputes</h3>
            <p className="text-3xl font-bold text-red-600">{openDisputes.length}</p>
            {openDisputes.length > 0 && (
              <p className="text-sm text-red-600 mt-1">Requires attention</p>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Resolved</h3>
            <p className="text-3xl font-bold text-green-600">{resolvedDisputes.length}</p>
          </div>
        </div>

        {/* Open Disputes */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Open Disputes</h2>
          {openDisputes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-600">No open disputes at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {openDisputes.map((dispute) => (
                <div key={dispute.id} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {dispute.order?.gig?.title || 'Order Dispute'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Order ID: {dispute.order_id.substring(0, 8)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {dispute.status.toUpperCase()}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(dispute.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Sponsor:</p>
                      <p className="font-medium">{dispute.order?.sponsor?.full_name || dispute.order?.sponsor?.username}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">KOL:</p>
                      <p className="font-medium">{dispute.order?.kol?.full_name || dispute.order?.kol?.username}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Opened by:</p>
                      <p className="font-medium">{dispute.opener?.full_name || dispute.opener?.username}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Order Amount:</p>
                      <p className="font-medium">${dispute.order?.amount?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Reason:</p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-900">{dispute.reason}</p>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-1">Refund Information:</p>
                    <p className="text-xs text-blue-700">
                      If cancelled: Sponsor receives ${dispute.order?.amount?.toFixed(2) || '0.00'} (base amount only)
                      <br />
                      Platform keeps: ${((dispute.order?.stripe_fee || 0) + (dispute.order?.service_fee || 0)).toFixed(2)} (processing + service fees)
                    </p>
                  </div>

                  <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-sm font-medium text-purple-900">Join Order Conversation</p>
                      </div>
                      <Link
                        href={`/orders/${dispute.order_id}`}
                        target="_blank"
                        className="inline-flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-800 font-medium"
                      >
                        <span>Open Order</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                    </div>
                    <p className="text-xs text-purple-700 mb-2">
                      Click &quot;Open Order&quot; to view the full order page where you can see the chat history between sponsor and KOL, and participate in the conversation to help mediate this dispute.
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-purple-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>Real-time chat available on order page</span>
                    </div>
                  </div>

                  {selectedDispute?.id === dispute.id ? (
                    <div className="space-y-4 border-t pt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Resolution Notes (Required)
                        </label>
                        <textarea
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Explain your decision and any relevant details..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleResolve(dispute.id, 'continue')}
                          disabled={isResolving}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium disabled:bg-gray-400"
                        >
                          {isResolving ? 'Processing...' : 'Continue Job'}
                        </button>
                        <button
                          onClick={() => handleResolve(dispute.id, 'cancel_refund')}
                          disabled={isResolving}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium disabled:bg-gray-400"
                        >
                          {isResolving ? 'Processing...' : 'Cancel & Refund'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDispute(null)
                            setResolutionNotes('')
                          }}
                          disabled={isResolving}
                          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setSelectedDispute(dispute)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium"
                      >
                        Resolve Dispute
                      </button>
                      <Link
                        href={`/orders/${dispute.order_id}`}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium text-center"
                      >
                        View Order
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved Disputes */}
        {resolvedDisputes.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Resolved Disputes</h2>
            <div className="space-y-4">
              {resolvedDisputes.map((dispute) => (
                <div key={dispute.id} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500 opacity-75">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {dispute.order?.gig?.title || 'Order Dispute'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Order ID: {dispute.order_id.substring(0, 8)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-1">
                        RESOLVED
                      </span>
                      <p className="text-xs font-medium text-gray-700">
                        {dispute.resolution_type === 'continue' ? 'Continued Job' : 'Cancelled & Refunded'}
                      </p>
                    </div>
                  </div>

                  {dispute.resolution_notes && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Resolution Notes:</p>
                      <p className="text-sm text-gray-600">{dispute.resolution_notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
