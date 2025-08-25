'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useRole } from '@/contexts/RoleContext'

export default function CreateGigPage() {
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
    preview_image_url: ''
  })
  const [previewImageFile, setPreviewImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { currentRole, theme } = useRole()
  
  const supabase = createClient()
  const router = useRouter()

  // Platform categories (billion+ users organized by type)
  const platformCategories = {
    'Social Media Platforms': [
      'Instagram', 'Facebook', 'Snapchat', 'Pinterest', 'TikTok'
    ],
    'Video Platforms': [
      'YouTube'
    ],
    'Messaging Platforms': [
      'WhatsApp', 'Telegram', 'WeChat (微信)', 'QQ'
    ]
  }

  // Content genre categories (replacing service categories)
  const genreCategories = [
    { value: 'fashion_beauty', label: 'Fashion & Beauty' },
    { value: 'health_fitness', label: 'Health & Fitness' },
    { value: 'food_cooking', label: 'Food & Cooking' },
    { value: 'travel', label: 'Travel & Adventure' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'tech', label: 'Technology' },
    { value: 'business', label: 'Business & Finance' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'education', label: 'Educational Content' },
    { value: 'sports', label: 'Sports & Recreation' },
    { value: 'music', label: 'Music & Arts' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'home_garden', label: 'Home & Garden' },
    { value: 'parenting', label: 'Parenting & Family' }
  ]

  // Flatten all platforms for easy processing and remove duplicates
  const allPlatforms = [...new Set(Object.values(platformCategories).flat())]

  const contentTypes = [
    { value: 'video', label: 'Video' },
    { value: 'post', label: 'Posts' }
  ]


  // Helper functions
  const selectPlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platform: platform
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }

      setPreviewImageFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  const removeImage = () => {
    setPreviewImageFile(null)
    setImagePreviewUrl('')
    setFormData(prev => ({ ...prev, preview_image_url: '' }))
  }


  useEffect(() => {
    // Redirect if not in KOL mode
    if (currentRole !== 'kol') {
      router.push('/dashboard')
    }
  }, [currentRole, router])

  // Don't render if not in KOL mode
  if (currentRole !== 'kol') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
          <p className="text-gray-600 mb-6">Only KOLs can create services. Please switch to KOL mode to use this feature.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
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
        .insert({
          kol_id: user.id,
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
          is_active: true
        })

      if (error) {
        setError(error.message)
        return
      }

      router.push('/dashboard')
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Service</h1>
            <p className="mt-2 text-gray-600">
              Share your expertise and create your service offering
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
                placeholder="I will create amazing content for your brand"
              />
              <p className="mt-1 text-sm text-gray-500">
                Write a clear, descriptive title for your service
              </p>
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
                placeholder="Describe your service in detail. What will you provide? What makes you unique? Include your experience and what clients can expect."
              />
              <p className="mt-1 text-sm text-gray-500">
                Provide detailed description of your service ({formData.description.length}/1000 characters)
              </p>
            </div>

            {/* Preview Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Gig Preview Image
              </label>
              
              {!imagePreviewUrl ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="mt-4">
                    <label htmlFor="preview-image" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload a preview image
                      </span>
                      <span className="mt-2 block text-sm text-gray-500">
                        PNG, JPG up to 5MB
                      </span>
                    </label>
                    <input
                      id="preview-image"
                      name="preview-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreviewUrl}
                    alt="Gig preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              <p className="mt-2 text-sm text-gray-500">
                This image will be displayed as the main preview for your gig. Choose an eye-catching image that represents your service.
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
                  {genreCategories.map(genre => (
                    <option key={genre.value} value={genre.value}>
                      {genre.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  What genre/niche is your content focused on?
                </p>
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
                  {contentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  What type of content will you create?
                </p>
              </div>
            </div>

            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Platform * 
                <span className="text-sm font-normal text-gray-500">
                  ({formData.platform ? '1 selected' : 'Select one'})
                </span>
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {allPlatforms.map(platform => (
                  <div key={platform} className="relative">
                    <input
                      type="radio"
                      id={`platform-${platform}`}
                      name="platform"
                      checked={formData.platform === platform}
                      onChange={() => selectPlatform(platform)}
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
              
              <p className="mt-3 text-sm text-gray-500">
                Select one platform where you want to offer this service. You can create separate gigs for other platforms.
              </p>
            </div>


            {/* Deliverables */}
            <div>
              <label htmlFor="deliverables" className="block text-sm font-medium text-gray-700 mb-3">
                What You'll Deliver *
              </label>
              <textarea
                id="deliverables"
                required
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.deliverables}
                onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                placeholder="Describe what you will deliver to the client (e.g., 1 Instagram reel, 3 story posts, usage rights for 30 days)"
              />
              <p className="mt-1 text-sm text-gray-500">
                Be specific about what the client will receive
              </p>
            </div>

            {/* Requirements from Client */}
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
                placeholder="What information or materials do you need from the client? (e.g., product details, brand guidelines, specific messaging)"
              />
              <p className="mt-1 text-sm text-gray-500">
                List any requirements or information you need from the client
              </p>
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
                    placeholder="500"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Minimum $50, Maximum $100,000
                </p>
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
                    placeholder="7"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">days</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  1-30 days delivery time
                </p>
              </div>
            </div>

            {/* Revisions and Fast Delivery */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="revisions_included" className="block text-sm font-medium text-gray-700">
                  Revisions Included
                </label>
                <select
                  id="revisions_included"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.revisions_included}
                  onChange={(e) => setFormData({ ...formData, revisions_included: e.target.value })}
                >
                  <option value="0">No revisions</option>
                  <option value="1">1 revision</option>
                  <option value="2">2 revisions</option>
                  <option value="3">3 revisions</option>
                  <option value="4">4 revisions</option>
                  <option value="5">5 revisions</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  How many revisions will you provide?
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    id="fast_delivery"
                    checked={formData.fast_delivery}
                    onChange={(e) => setFormData({ ...formData, fast_delivery: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="fast_delivery" className="text-sm font-medium text-gray-700">
                    Offer Fast Delivery
                  </label>
                </div>

                {formData.fast_delivery && (
                  <div>
                    <label htmlFor="fast_delivery_days" className="block text-sm font-medium text-gray-700">
                      Fast Delivery Time
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        id="fast_delivery_days"
                        required={formData.fast_delivery}
                        min="1"
                        max="7"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.fast_delivery_days}
                        onChange={(e) => setFormData({ ...formData, fast_delivery_days: e.target.value })}
                        placeholder="3"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">days</span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Rush delivery time (must be less than standard delivery)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Gig Preview */}
            <GigPreview formData={formData} imagePreviewUrl={imagePreviewUrl} />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`${theme.primary} ${theme.primaryHover} text-white px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Creating...' : 'Create Service'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Gig Preview Component
function GigPreview({ formData, imagePreviewUrl }: {
  formData: any
  imagePreviewUrl: string
}) {
  // Define genre categories for preview component
  const genreMap: { [key: string]: string } = {
    'fashion_beauty': 'Fashion & Beauty',
    'health_fitness': 'Health & Fitness', 
    'food_cooking': 'Food & Cooking',
    'travel': 'Travel & Adventure',
    'gaming': 'Gaming',
    'tech': 'Technology',
    'business': 'Business & Finance',
    'lifestyle': 'Lifestyle',
    'entertainment': 'Entertainment',
    'education': 'Educational Content',
    'sports': 'Sports & Recreation',
    'music': 'Music & Arts',
    'automotive': 'Automotive',
    'home_garden': 'Home & Garden',
    'parenting': 'Parenting & Family'
  }
  
  // Find the selected genre label
  const selectedGenre = genreMap[formData.genre_category] || 'Unknown Genre'
  
  // Only show preview if we have some basic info
  if (!formData.title && !formData.description && !imagePreviewUrl) {
    return null
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">
        📋 Gig Preview
      </h3>
      <p className="text-sm text-blue-700 mb-4">
        This is how your gig will appear to potential clients:
      </p>
      
      {/* Gig Card Preview */}
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6 max-w-md">
        {/* Preview Image */}
        {imagePreviewUrl ? (
          <div className="mb-4">
            <img
              src={imagePreviewUrl}
              alt="Gig preview"
              className="w-full h-40 object-cover rounded-lg"
            />
          </div>
        ) : (
          <div className="mb-4 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-500 text-sm">No preview image uploaded</span>
          </div>
        )}

        {/* Gig Info */}
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {formData.title || 'Your Service Title'}
          </h3>
          
          {/* Platform and Genre */}
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.platform && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                📱 {formData.platform}
              </span>
            )}
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              🎯 {selectedGenre}
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
              {formData.content_type === 'video' ? '🎥' : '📝'} {formData.content_type}
            </span>
          </div>
          
          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
            {formData.description || 'Your service description will appear here...'}
          </p>
        </div>
        
        {/* Pricing and Delivery */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            ${formData.price || '0'}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">
            {formData.delivery_days || '0'} days delivery
            {formData.fast_delivery && formData.fast_delivery_days && (
              <span className="ml-2 text-orange-600 font-medium">
                ⚡ Rush: {formData.fast_delivery_days} days
              </span>
            )}
          </div>
        </div>

        {/* Deliverables Preview */}
        {formData.deliverables.trim() && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">What you'll get:</h4>
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {formData.deliverables}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
          View Details
        </button>
      </div>
    </div>
  )
}

