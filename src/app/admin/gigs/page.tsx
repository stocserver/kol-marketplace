'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { GENRE_CATEGORIES } from '@/lib/constants'
import { useRouter } from 'next/navigation'

interface Gig {
  id: string
  title: string
  description: string
  price: number
  delivery_days: number
  platform: string
  content_type: string
  genre_category: string
  deliverables: string | string[]
  requirements: string | string[]
  revisions_included: number
  fast_delivery: boolean
  fast_delivery_days?: number
  preview_image_url?: string
  image_urls?: string[]
  approval_status: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
  approved_at?: string
  approved_by?: string
  created_at: string
  kol: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    bio?: string
    country?: string
    languages?: string[]
    followers?: number
  }
}

export default function AdminGigsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [modalGig, setModalGig] = useState<Gig | null>(null)
  const [reviewGig, setReviewGig] = useState<Gig | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const supabase = createClient()

  // Simple admin check - in production, you'd want proper role-based access control
  const isAdmin = user?.email === 'admin@kolmarketplace.com' || 
                  user?.email?.endsWith('@admin.com') || 
                  user?.email === 'ivn.c.yu@gmail.com'

  useEffect(() => {
    if (!user) return
    if (!isAdmin) {
      router.push('/dashboard')
      return
    }
    fetchGigs()
  }, [user, isAdmin, filter, supabase, router])

  const fetchGigs = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('gigs')
        .select(`
          *,
          kol:profiles!gigs_kol_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            bio,
            country,
            languages,
            followers
          )
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('approval_status', filter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching gigs:', error)
        return
      }

      setGigs(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateGigStatus = async (gigId: string, status: 'approved' | 'rejected', notes?: string) => {
    setActionLoading(gigId)
    try {
      const updateData: any = {
        approval_status: status,
        approved_by: user?.id,
        approved_at: new Date().toISOString()
      }

      if (notes) {
        updateData.admin_notes = notes
      }

      const { error } = await supabase
        .from('gigs')
        .update(updateData)
        .eq('id', gigId)

      if (error) {
        console.error('Error updating gig:', error)
        alert('Failed to update gig status')
        return
      }

      // Update local state
      setGigs(prev => prev.map(gig => 
        gig.id === gigId 
          ? { ...gig, approval_status: status, admin_notes: notes, approved_at: new Date().toISOString() }
          : gig
      ))

      setModalGig(null)
      setRejectNotes('')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to update gig status')
    } finally {
      setActionLoading(null)
    }
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Gig Management</h1>
          <p className="text-gray-600 mt-2">Review and approve KOL service offerings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Gigs</h3>
            <p className="text-3xl font-bold text-gray-900">{gigs.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Review</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {gigs.filter(g => g.approval_status === 'pending').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Approved</h3>
            <p className="text-3xl font-bold text-green-600">
              {gigs.filter(g => g.approval_status === 'approved').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Rejected</h3>
            <p className="text-3xl font-bold text-red-600">
              {gigs.filter(g => g.approval_status === 'rejected').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex space-x-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  filter === status
                    ? status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      status === 'approved' ? 'bg-green-100 text-green-700' :
                      status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {status} ({status === 'all' ? gigs.length : gigs.filter(g => g.approval_status === status).length})
              </button>
            ))}
          </div>
        </div>

        {/* Gigs List */}
        <div className="space-y-6">
          {gigs.map((gig) => (
            <div key={gig.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    {/* Image Display */}
                    {(gig.image_urls && gig.image_urls.length > 0) || gig.preview_image_url ? (
                      <div className="flex space-x-2">
                        {gig.image_urls && gig.image_urls.length > 0 ? (
                          gig.image_urls.slice(0, 3).map((url, index) => (
                            <div key={index} className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={url}
                                alt={`${gig.title} - Image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))
                        ) : gig.preview_image_url ? (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={gig.preview_image_url}
                              alt={gig.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : null}
                        {gig.image_urls && gig.image_urls.length > 3 && (
                          <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-600">
                            +{gig.image_urls.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{gig.title}</h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">{gig.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>By @{gig.kol.username}</span>
                        <span>•</span>
                        <span>${gig.price}</span>
                        <span>•</span>
                        <span>{gig.delivery_days} days</span>
                        <span>•</span>
                        <span className="capitalize">{gig.platform}</span>
                        <span>•</span>
                        <span>{new Date(gig.created_at).toLocaleDateString()}</span>
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
                  </div>

                  {gig.admin_notes && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-800"><strong>Admin Notes:</strong> {gig.admin_notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end space-y-3 ml-6">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      gig.approval_status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : gig.approval_status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {gig.approval_status === 'approved' ? '✓ Approved' :
                     gig.approval_status === 'rejected' ? '✗ Rejected' :
                     '⏳ Pending'}
                  </span>

                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => setReviewGig(gig)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      📋 Review Details
                    </button>
                    
                    {gig.approval_status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateGigStatus(gig.id, 'approved')}
                          disabled={actionLoading === gig.id}
                          className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === gig.id ? 'Processing...' : 'Quick Approve'}
                        </button>
                        <button
                          onClick={() => setModalGig(gig)}
                          disabled={actionLoading === gig.id}
                          className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {gigs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No gigs found for the selected filter.</p>
          </div>
        )}

        {/* Detailed Review Modal */}
        {reviewGig && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Gig Review</h3>
                  <p className="text-gray-600">Complete details for approval decision</p>
                </div>
                <button
                  onClick={() => {
                    setReviewGig(null)
                    setSelectedImageIndex(0)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Gig Images Gallery */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">📷 Gig Images ({(reviewGig.image_urls?.length || 0) + (reviewGig.preview_image_url && !reviewGig.image_urls?.length ? 1 : 0)} total)</h4>
                  
                  {/* Get all images */}
                  {(() => {
                    const allImages = reviewGig.image_urls && reviewGig.image_urls.length > 0 
                      ? reviewGig.image_urls 
                      : reviewGig.preview_image_url 
                      ? [reviewGig.preview_image_url]
                      : [];
                    
                    return allImages.length > 0 ? (
                      <div className="space-y-4">
                        {/* Main Image Display */}
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                          <img
                            src={allImages[selectedImageIndex]}
                            alt={`${reviewGig.title} - Image ${selectedImageIndex + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/api/placeholder/800/450';
                            }}
                          />
                          
                          {/* Image Counter */}
                          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                            {selectedImageIndex + 1} / {allImages.length}
                          </div>
                          
                          {/* Navigation Arrows */}
                          {allImages.length > 1 && (
                            <>
                              {selectedImageIndex > 0 && (
                                <button
                                  onClick={() => setSelectedImageIndex(selectedImageIndex - 1)}
                                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                  </svg>
                                </button>
                              )}
                              {selectedImageIndex < allImages.length - 1 && (
                                <button
                                  onClick={() => setSelectedImageIndex(selectedImageIndex + 1)}
                                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        
                        {/* Thumbnail Navigation */}
                        {allImages.length > 1 && (
                          <div className="flex gap-2 overflow-x-auto">
                            {allImages.map((image, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedImageIndex(index)}
                                className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                                  selectedImageIndex === index 
                                    ? 'border-blue-500 opacity-100' 
                                    : 'border-gray-200 opacity-70 hover:opacity-100'
                                }`}
                              >
                                <img
                                  src={image}
                                  alt={`Thumbnail ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p>No images provided</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Gig Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">📝 Basic Information</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Title</label>
                          <p className="text-gray-900">{reviewGig.title}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <p className="text-gray-900 whitespace-pre-wrap">{reviewGig.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Service Details */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">🎯 Service Details</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Platform</label>
                            <p className="text-gray-900">{reviewGig.platform}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Content Type</label>
                            <p className="text-gray-900 capitalize">{reviewGig.content_type}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Genre Category</label>
                          <p className="text-gray-900">
                            {GENRE_CATEGORIES.find(cat => cat.value === reviewGig.genre_category)?.label || reviewGig.genre_category}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Deliverables */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">📦 What's Included</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-gray-900 whitespace-pre-wrap">
                          {Array.isArray(reviewGig.deliverables) 
                            ? reviewGig.deliverables.map((item, index) => (
                                <div key={index} className="flex items-start mb-2">
                                  <span className="text-green-600 mr-2">•</span>
                                  <span>{item}</span>
                                </div>
                              ))
                            : reviewGig.deliverables
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* KOL Information */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">👤 KOL Information</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-4">
                          {reviewGig.kol.avatar_url && (
                            <img 
                              src={reviewGig.kol.avatar_url} 
                              alt={reviewGig.kol.full_name}
                              className="w-12 h-12 rounded-full mr-3"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{reviewGig.kol.full_name}</p>
                            <p className="text-gray-600">@{reviewGig.kol.username}</p>
                          </div>
                        </div>
                        {reviewGig.kol.bio && (
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700">Bio</label>
                            <p className="text-gray-900">{reviewGig.kol.bio}</p>
                          </div>
                        )}
                        {reviewGig.kol.followers && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Followers</label>
                            <p className="text-gray-900">{reviewGig.kol.followers.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pricing & Terms */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">💰 Pricing & Terms</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Price</label>
                            <p className="text-2xl font-bold text-green-600">${reviewGig.price}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Delivery Time</label>
                            <p className="text-gray-900">{reviewGig.delivery_days} days</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Revisions Included</label>
                          <p className="text-gray-900">{reviewGig.revisions_included}</p>
                        </div>
                        {reviewGig.fast_delivery && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Fast Delivery Option</label>
                            <p className="text-orange-600 font-medium">⚡ {reviewGig.fast_delivery_days} days (rush delivery)</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Requirements */}
                    {reviewGig.requirements && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">📋 Client Requirements</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-gray-900 whitespace-pre-wrap">
                            {Array.isArray(reviewGig.requirements) 
                              ? reviewGig.requirements.map((item, index) => (
                                  <div key={index} className="flex items-start mb-2">
                                    <span className="text-blue-600 mr-2">•</span>
                                    <span>{item}</span>
                                  </div>
                                ))
                              : reviewGig.requirements
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Approval Actions */}
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">🔍 Approval Decision</h4>
                  {reviewGig.approval_status === 'pending' ? (
                    <div className="flex space-x-4">
                      <button
                        onClick={() => {
                          updateGigStatus(reviewGig.id, 'approved')
                          setReviewGig(null)
                        }}
                        disabled={actionLoading === reviewGig.id}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                      >
                        {actionLoading === reviewGig.id ? 'Processing...' : '✅ Approve Gig'}
                      </button>
                      <button
                        onClick={() => {
                          setModalGig(reviewGig)
                          setReviewGig(null)
                        }}
                        disabled={actionLoading === reviewGig.id}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
                      >
                        ❌ Reject Gig
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <span className={`inline-flex px-4 py-2 rounded-full text-lg font-semibold ${
                        reviewGig.approval_status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {reviewGig.approval_status === 'approved' ? '✅ Already Approved' : '❌ Already Rejected'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {modalGig && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Gig</h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting "{modalGig.title}":
              </p>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={4}
                placeholder="Explain why this gig is being rejected..."
                required
              />
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => {
                    setModalGig(null)
                    setRejectNotes('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateGigStatus(modalGig.id, 'rejected', rejectNotes)}
                  disabled={!rejectNotes.trim() || actionLoading === modalGig.id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading === modalGig.id ? 'Processing...' : 'Reject Gig'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}