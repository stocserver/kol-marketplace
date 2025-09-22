'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useRole } from '@/contexts/RoleContext'
import { PLATFORM_CATEGORIES, ALL_PLATFORMS, GENRE_CATEGORIES, CONTENT_TYPES } from '@/lib/constants'

export default function EditGigPage() {
  const params = useParams()
  const gigId = params.id as string
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    delivery_days: '',
    platform: '',
    content_type: 'video',
    genre_category: 'fashion_beauty',
    deliverables: '',
    requirements: '',
    revisions_included: '1',
    fast_delivery: false,
    fast_delivery_days: '',
    preview_image_url: '',
    is_active: true
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { currentRole, theme } = useRole()
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Redirect if not in KOL mode
    if (currentRole !== 'kol') {
      router.push('/dashboard')
      return
    }

    const loadGig = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('gigs')
          .select('*')
          .eq('id', gigId)
          .eq('kol_id', user.id)
          .single()

        if (error) {
          console.error('Error loading gig:', error)
          router.push('/gigs')
          return
        }

        if (!data) {
          router.push('/gigs')
          return
        }

        setFormData({
          title: data.title,
          description: data.description,
          price: data.price.toString(),
          delivery_days: data.delivery_days.toString(),
          platform: data.platform,
          content_type: data.content_type,
          genre_category: data.genre_category,
          deliverables: data.deliverables,
          requirements: data.requirements || '',
          revisions_included: data.revisions_included.toString(),
          fast_delivery: data.fast_delivery || false,
          fast_delivery_days: data.fast_delivery_days?.toString() || '',
          preview_image_url: data.preview_image_url || '',
          is_active: data.is_active
        })
      } catch (error) {
        console.error('Error:', error)
        router.push('/gigs')
      } finally {
        setLoading(false)
      }
    }

    loadGig()
  }, [gigId, currentRole, router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const price = parseInt(formData.price)
      const delivery_days = parseInt(formData.delivery_days)
      const revisions_included = parseInt(formData.revisions_included)
      const fast_delivery_days = formData.fast_delivery ? parseInt(formData.fast_delivery_days) : null

      // Validation
      if (price < 50 || price > 100000) {
        setError('Price must be between $50 and $100,000')
        return
      }

      if (delivery_days < 1 || delivery_days > 30) {
        setError('Delivery time must be between 1 and 30 days')
        return
      }

      if (!formData.platform) {
        setError('Please select a platform')
        return
      }

      if (!formData.deliverables.trim()) {
        setError('Please specify what you will deliver')
        return
      }

      if (formData.fast_delivery && (!fast_delivery_days || fast_delivery_days >= delivery_days)) {
        setError('Fast delivery must be less than standard delivery time')
        return
      }

      const { error } = await supabase
        .from('gigs')
        .update({
          title: formData.title,
          description: formData.description,
          price: price,
          delivery_days: delivery_days,
          platform: formData.platform,
          content_type: formData.content_type,
          genre_category: formData.genre_category,
          deliverables: formData.deliverables,
          requirements: formData.requirements,
          revisions_included: revisions_included,
          fast_delivery: formData.fast_delivery,
          fast_delivery_days: fast_delivery_days,
          preview_image_url: formData.preview_image_url,
          is_active: formData.is_active
        })
        .eq('id', gigId)
        .eq('kol_id', user.id)

      if (error) {
        setError(error.message)
        return
      }

      router.push('/gigs')
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Service</h1>
            <p className="mt-2 text-gray-600">
              Update your service offering details
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Service Title
              </label>
              <input
                type="text"
                id="title"
                required
                maxLength={100}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Service Description
              </label>
              <textarea
                id="description"
                required
                rows={6}
                maxLength={1000}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <p className="mt-1 text-sm text-gray-500">
                {formData.description.length}/1000 characters
              </p>
            </div>

            {/* Genre Category and Content Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="genre_category" className="block text-sm font-medium text-gray-700">
                  Content Genre
                </label>
                <select
                  id="genre_category"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.genre_category}
                  onChange={(e) => setFormData({ ...formData, genre_category: e.target.value })}
                >
                  {GENRE_CATEGORIES.map(genre => (
                    <option key={genre.value} value={genre.value}>
                      {genre.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="content_type" className="block text-sm font-medium text-gray-700">
                  Content Type
                </label>
                <select
                  id="content_type"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.content_type}
                  onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                >
                  {CONTENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Platform * 
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {ALL_PLATFORMS.map(platform => (
                  <div key={platform} className="relative">
                    <input
                      type="radio"
                      id={`platform-${platform}`}
                      name="platform"
                      checked={formData.platform === platform}
                      onChange={() => setFormData({ ...formData, platform })}
                      className="sr-only"
                    />
                    <label
                      htmlFor={`platform-${platform}`}
                      className={`block w-full px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors text-center ${
                        formData.platform === platform
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                          : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {platform}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables */}
            <div>
              <label htmlFor="deliverables" className="block text-sm font-medium text-gray-700 mb-3">
                What You&apos;ll Deliver *
              </label>
              <textarea
                id="deliverables"
                required
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.deliverables}
                onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
              />
            </div>

            {/* Requirements */}
            <div>
              <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-3">
                What You Need from the Client
              </label>
              <textarea
                id="requirements"
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price ($)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="price"
                    required
                    min="50"
                    max="100000"
                    className="pl-7 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="delivery_days" className="block text-sm font-medium text-gray-700">
                  Delivery Time
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="delivery_days"
                    required
                    min="1"
                    max="30"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.delivery_days}
                    onChange={(e) => setFormData({ ...formData, delivery_days: e.target.value })}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Service Status</h3>
                <p className="text-sm text-gray-600">
                  {formData.is_active ? 'This service is active and visible to clients' : 'This service is paused and not visible to clients'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={() => router.push('/gigs')}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`${theme.primary} ${theme.primaryHover} text-white px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}