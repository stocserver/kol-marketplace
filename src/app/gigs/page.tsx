'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { GENRE_CATEGORIES } from '@/lib/constants'
import DeleteConfirmationModal from '@/components/gig/DeleteConfirmationModal'

interface Gig {
  id: string
  title: string
  description: string
  price: number
  delivery_days: number
  platform: string
  content_type: string
  genre_category: string
  deliverables: string
  requirements: string
  revisions_included: number
  fast_delivery: boolean
  fast_delivery_days?: number
  preview_image_url?: string
  is_active: boolean
  approval_status?: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
  approved_at?: string
  approved_by?: string
  created_at: string
  orders_count?: number
  rating?: number
  kol_id: string
}

export default function GigsPage() {
  const { user } = useAuth()
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all')
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, gig: Gig | null}>({
    isOpen: false,
    gig: null
  })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchGigs = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('gigs')
          .select('*')
          .eq('kol_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching gigs:', error)
          setGigs([]) // Set empty array on error
          return
        }

        setGigs(data || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGigs()
  }, [user, supabase])

  const toggleGigStatus = async (gigId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('gigs')
        .update({ is_active: !currentStatus })
        .eq('id', gigId)

      if (error) {
        console.error('Error updating gig status:', error)
        alert('Failed to update gig status. Please try again.')
        return
      }

      setGigs(prev => prev.map(gig => 
        gig.id === gigId ? { ...gig, is_active: !currentStatus } : gig
      ))
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to update gig status. Please try again.')
    }
  }

  const handleDeleteGig = async () => {
    if (!deleteModal.gig) return

    setDeleteLoading(true)
    try {
      // Check if gig has any active orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, status')
        .eq('gig_id', deleteModal.gig.id)
        .in('status', ['pending', 'confirmed', 'in_progress', 'submitted'])

      if (ordersError) {
        console.error('Error checking orders:', ordersError)
        alert('Failed to check gig orders. Please try again.')
        return
      }

      if (orders && orders.length > 0) {
        alert(`Cannot delete gig. There are ${orders.length} active orders. Please complete or cancel them first.`)
        setDeleteModal({ isOpen: false, gig: null })
        return
      }

      // Delete the gig
      const { error } = await supabase
        .from('gigs')
        .delete()
        .eq('id', deleteModal.gig.id)

      if (error) {
        console.error('Error deleting gig:', error)
        alert('Failed to delete gig. Please try again.')
        return
      }

      // Remove from local state
      setGigs(prev => prev.filter(gig => gig.id !== deleteModal.gig!.id))
      setDeleteModal({ isOpen: false, gig: null })
      
      // Show success message
      alert('Gig deleted successfully!')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete gig. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const openDeleteModal = (gig: Gig) => {
    setDeleteModal({ isOpen: true, gig })
  }

  const closeDeleteModal = () => {
    if (!deleteLoading) {
      setDeleteModal({ isOpen: false, gig: null })
    }
  }

  const filteredGigs = gigs.filter(gig => {
    if (filter === 'active') return gig.is_active
    if (filter === 'paused') return !gig.is_active
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Gigs</h1>
            <p className="text-gray-600 mt-2">
              Manage your service offerings ({gigs.length}/3 gigs used)
            </p>
            {gigs.length >= 3 && (
              <p className="text-amber-600 text-sm mt-1">
                ⚠️ You&apos;ve reached the maximum limit of 3 gigs
              </p>
            )}
          </div>
          <Link
            href="/gigs/create"
            className={`px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors ${
              gigs.length >= 3 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            onClick={(e) => {
              if (gigs.length >= 3) {
                e.preventDefault()
                alert('You have reached the maximum limit of 3 gigs. Please delete an existing gig to create a new one.')
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create New Gig</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Gigs</h3>
            <p className="text-3xl font-bold text-gray-900">{gigs.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Active Gigs</h3>
            <p className="text-3xl font-bold text-green-600">{gigs.filter(g => g.is_active).length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Orders</h3>
            <p className="text-3xl font-bold text-blue-600">{gigs.reduce((acc, gig) => acc + (gig.orders_count || 0), 0)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Average Rating</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {gigs.length > 0 ? (gigs.reduce((acc, gig) => acc + (gig.rating || 0), 0) / gigs.length).toFixed(1) : '0.0'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({gigs.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Active ({gigs.filter(g => g.is_active).length})
              </button>
              <button
                onClick={() => setFilter('paused')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'paused'
                    ? 'bg-gray-100 text-gray-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Paused ({gigs.filter(g => !g.is_active).length})
              </button>
            </div>
          </div>
        </div>

        {/* Gigs List */}
        {filteredGigs.length > 0 ? (
          <div className="space-y-6">
            {filteredGigs.map((gig) => (
              <div key={gig.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        {gig.preview_image_url && (
                          <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={gig.preview_image_url}
                              alt={gig.title}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{gig.title}</h3>
                          <p className="text-gray-600 mb-3 line-clamp-2">{gig.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>${gig.price}</span>
                            <span>•</span>
                            <span>{gig.delivery_days} days delivery</span>
                            <span>•</span>
                            <span className="capitalize">{gig.platform}</span>
                            {(gig.orders_count || 0) > 0 && (
                              <>
                                <span>•</span>
                                <span>{gig.orders_count} orders</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-md">
                          {gig.platform}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-md">
                          {GENRE_CATEGORIES.find(cat => cat.value === gig.genre_category)?.label || gig.genre_category}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-md">
                          {gig.content_type}
                        </span>
                        {gig.fast_delivery && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-md">
                            Fast delivery
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-3 ml-6">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              gig.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {gig.is_active ? 'Active' : 'Paused'}
                          </span>
                          {(gig.rating || 0) > 0 && (
                            <div className="flex items-center space-x-1 text-yellow-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-sm font-medium">{gig.rating}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Approval Status */}
                        <div className="flex items-center">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              gig.approval_status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : gig.approval_status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {gig.approval_status === 'approved' ? '✓ Approved' :
                             gig.approval_status === 'rejected' ? '✗ Rejected' :
                             '⏳ Pending Review'}
                          </span>
                        </div>
                        
                        {gig.approval_status === 'rejected' && gig.admin_notes && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border-l-2 border-red-200">
                            <strong>Admin Notes:</strong> {gig.admin_notes}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <Link
                            href={`/gigs/${gig.id}/edit`}
                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => toggleGigStatus(gig.id, gig.is_active)}
                            disabled={gig.approval_status !== 'approved'}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              gig.approval_status !== 'approved'
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : gig.is_active
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={gig.approval_status !== 'approved' ? 'Gig must be approved to activate' : ''}
                          >
                            {gig.is_active ? 'Pause' : 'Activate'}
                          </button>
                          <Link
                            href={`/gigs/${gig.id}`}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            View
                          </Link>
                        </div>
                        
                        <button
                          onClick={() => openDeleteModal(gig)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No gigs yet' : `No ${filter} gigs`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Create your first gig to start earning'
                : `You don't have any ${filter} gigs at the moment`
              }
            </p>
            {filter === 'all' && (
              <Link
                href="/gigs/create"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Your First Gig</span>
              </Link>
            )}
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteGig}
          gigTitle={deleteModal.gig?.title || ''}
          loading={deleteLoading}
        />
      </div>
    </div>
  )
}