'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useRole } from '@/contexts/RoleContext'
import { useAuth } from '@/hooks/useAuth'
import { ALL_PLATFORMS, GENRE_CATEGORIES, CONTENT_TYPES } from '@/lib/constants'

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
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gigCount, setGigCount] = useState(0)
  const [checkingGigLimit, setCheckingGigLimit] = useState(true)
  const { currentRole, theme } = useRole()
  const { user } = useAuth()
  
  const supabase = createClient()
  const router = useRouter()

  // Check gig limit on component mount
  useEffect(() => {
    const checkGigLimit = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('gigs')
          .select('id')
          .eq('kol_id', user.id)

        if (error) {
          console.error('Error checking gig count:', error)
          setError('Failed to check gig limit')
          return
        }

        setGigCount(data?.length || 0)
      } catch (error) {
        console.error('Error:', error)
        setError('Failed to check gig limit')
      } finally {
        setCheckingGigLimit(false)
      }
    }

    checkGigLimit()
  }, [user, supabase])

  // Helper functions
  const selectPlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platform: platform
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return
    
    // Check if adding these files would exceed the 3 image limit
    if (imageFiles.length + files.length > 3) {
      setError('You can upload up to 3 images maximum')
      return
    }
    
    // Validate each file
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Please select valid image files only')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB')
        return
      }
    }

    // Add files and create preview URLs
    const newFiles = [...imageFiles, ...files]
    const newPreviewUrls = [...imagePreviewUrls]
    
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        newPreviewUrls.push(reader.result as string)
        if (newPreviewUrls.length === newFiles.length) {
          setImagePreviewUrls(newPreviewUrls)
        }
      }
      reader.readAsDataURL(file)
    })
    
    setImageFiles(newFiles)
    setError('')
  }

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index)
    const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index)
    
    setImageFiles(newFiles)
    setImagePreviewUrls(newPreviewUrls)
  }

  const fillRandomData = () => {
    try {
    const randomTitles = [
      "I will create viral Instagram reels for your fashion brand",
      "I will produce engaging TikTok videos for your tech startup",
      "I will design stunning YouTube thumbnails and intros",
      "I will write compelling Facebook ad copy that converts",
      "I will create professional LinkedIn content for your business",
      "I will shoot aesthetic Pinterest photos for your lifestyle brand",
      "I will produce gaming content for your Twitch channel"
    ]

    const randomDescriptions = [
      "Transform your brand's social media presence with high-quality, engaging content that resonates with your target audience. I specialize in creating authentic, scroll-stopping content that drives engagement and builds community around your brand. With over 2 years of experience in content creation and a deep understanding of platform algorithms, I'll help you achieve your marketing goals.",
      "Let me create compelling video content that captures attention and drives action. I use the latest trends, music, and editing techniques to ensure your content stands out in crowded feeds. Whether you need product showcases, behind-the-scenes content, or trend-based videos, I'll deliver content that aligns with your brand voice and objectives.",
      "Professional content creation service designed to elevate your brand's online presence. I combine creative storytelling with strategic marketing insights to produce content that not only looks great but also performs well. From concept development to final delivery, I handle every aspect of the content creation process."
    ]

    const randomDeliverables = [
      "• 1 high-quality video (30-60 seconds)\n• 3 Instagram Stories\n• Captions and hashtags\n• 2 rounds of revisions\n• Commercial usage rights for 6 months",
      "• 5 professional photos\n• Advanced photo editing and retouching\n• 3 different caption variations\n• Optimized hashtag research\n• Full commercial usage rights",
      "• 1 custom video content piece\n• Trending audio integration\n• Professional video editing\n• Thumbnail design\n• Performance optimization tips"
    ]

    const randomRequirements = [
      "Please provide:\n• Product details or brand guidelines\n• Preferred posting dates\n• Any specific messaging requirements\n• Brand colors and style preferences\n• Target audience information",
      "I'll need:\n• High-resolution product images or samples\n• Brand guidelines (if available)\n• Key messaging points\n• Preferred tone and style\n• Any hashtags to include/avoid",
      "Please share:\n• Campaign objectives and goals\n• Brand assets (logos, fonts, colors)\n• Content that has worked well before\n• Any compliance requirements\n• Preferred posting schedule"
    ]

    const randomPrices = [299, 450, 599, 750, 899, 1200, 1500]
    const randomDeliveryDays = [3, 5, 7, 10, 14]
    const randomRevisions = [1, 2, 3]

    const randomIndex = Math.floor(Math.random() * randomTitles.length)
    const fastDelivery = Math.random() > 0.5
    
    setFormData({
      title: randomTitles[randomIndex],
      description: randomDescriptions[Math.floor(Math.random() * randomDescriptions.length)],
      price: randomPrices[Math.floor(Math.random() * randomPrices.length)].toString(),
      delivery_days: randomDeliveryDays[Math.floor(Math.random() * randomDeliveryDays.length)].toString(),
      platform: ALL_PLATFORMS[Math.floor(Math.random() * ALL_PLATFORMS.length)],
      content_type: Math.random() > 0.5 ? 'video' : 'post',
      genre_category: GENRE_CATEGORIES[Math.floor(Math.random() * GENRE_CATEGORIES.length)].value,
      deliverables: randomDeliverables[Math.floor(Math.random() * randomDeliverables.length)],
      requirements: randomRequirements[Math.floor(Math.random() * randomRequirements.length)],
      revisions_included: randomRevisions[Math.floor(Math.random() * randomRevisions.length)].toString(),
      fast_delivery: fastDelivery,
      fast_delivery_days: fastDelivery ? Math.floor(Math.random() * 3 + 1).toString() : '',
      preview_image_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400'
    })
    
    // Set a random preview image
    setImagePreviewUrls(['https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400'])
    
    console.log('Random data filled successfully')
    } catch (error) {
      console.error('Error filling random data:', error)
      alert('Failed to fill random data. Please try again.')
    }
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
          <p className="text-sm text-gray-500 mb-4">Current role: {currentRole || 'not available'}</p>
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

    // Check gig limit before submission
    if (gigCount >= 3) {
      setError('You have reached the maximum limit of 3 gigs. Please delete an existing gig to create a new one.')
      setLoading(false)
      return
    }

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

      // Process deliverables and requirements into arrays
      const deliverablesList = formData.deliverables
        .split('\n')
        .map(item => item.trim().replace(/^[•\-\*]\s*/, ''))
        .filter(item => item.length > 0)

      const requirementsList = formData.requirements
        .split('\n')
        .map(item => item.trim().replace(/^[•\-\*]\s*/, ''))
        .filter(item => item.length > 0)

      const imageUrls: string[] = []

      // Upload images to Supabase storage if files are selected
      if (imageFiles.length > 0) {
        try {
          console.log(`Uploading ${imageFiles.length} images...`)
          
          // Debug: Check Supabase session
          const { data: session, error: sessionError } = await supabase.auth.getSession()
          console.log('Supabase session:', session?.session?.user?.id, 'Session error:', sessionError)
          
          // Upload each image
          for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i]
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Date.now()}-${i}.${fileExt}`
            
            console.log(`Uploading image ${i + 1}:`, fileName, 'Size:', file.size, 'bytes')
            
            const { error: uploadError } = await supabase.storage
              .from('gig-images')
              .upload(fileName, file)

            if (uploadError) {
              console.error(`Image ${i + 1} upload error:`, uploadError)
              setError(`Failed to upload image ${i + 1}: ${uploadError.message}`)
              return
            }

            // Get the public URL
            const { data: urlData } = supabase.storage
              .from('gig-images')
              .getPublicUrl(fileName)

            imageUrls.push(urlData.publicUrl)
          }
          
          console.log('All images uploaded successfully:', imageUrls)
        } catch (uploadError) {
          console.error('Image upload error:', uploadError)
          setError('Failed to upload images')
          return
        }
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
          deliverables: deliverablesList,
          requirements: requirementsList,
          approval_status: 'pending',
          revisions_included: revisions_included,
          fast_delivery: formData.fast_delivery,
          fast_delivery_days: fast_delivery_days,
          preview_image_url: imageUrls[0] || null,
          image_urls: imageUrls,
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

  // Show loading while checking gig limit
  if (checkingGigLimit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show gig limit reached message
  if (gigCount >= 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Gig Limit Reached</h1>
          <p className="text-gray-600 mb-6">
            You have reached the maximum limit of 3 gigs ({gigCount}/3). Please delete an existing gig to create a new one.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/gigs')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Manage My Gigs
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create New Service</h1>
                <p className="mt-2 text-gray-600">
                  Share your expertise and create your service offering ({gigCount}/3 gigs used)
                </p>
              </div>
              <button
                type="button"
                onClick={fillRandomData}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center space-x-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span>Fill Test Data</span>
              </button>
            </div>
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

            {/* Multiple Images Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Gig Images ({imageFiles.length}/3)
              </label>
              
              {/* Image Grid */}
              {imagePreviewUrls.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Gig image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Main
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Upload Area */}
              {imageFiles.length < 3 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="mt-4">
                    <label htmlFor="gig-images" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        {imageFiles.length === 0 ? 'Upload gig images' : `Add more images (${3 - imageFiles.length} remaining)`}
                      </span>
                      <span className="mt-2 block text-sm text-gray-500">
                        PNG, JPG up to 5MB each • Up to 3 images total
                      </span>
                    </label>
                    <input
                      id="gig-images"
                      name="gig-images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </div>
                </div>
              )}
              
              <p className="mt-2 text-sm text-gray-500">
                Upload up to 3 high-quality images that showcase your service. The first image will be used as the main preview.
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
                  {CONTENT_TYPES.map(type => (
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
                {ALL_PLATFORMS.map(platform => (
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
                What You&apos;ll Deliver *
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
            <GigPreview formData={formData} imagePreviewUrls={imagePreviewUrls} />

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
interface GigFormData {
  title: string
  description: string
  price: string
  delivery_days: string
  platform: string
  content_type: string
  genre_category: string
  deliverables: string
  requirements: string
  revisions_included: string
  fast_delivery: boolean
  fast_delivery_days: string
  preview_image_url: string
}

function GigPreview({ formData, imagePreviewUrls }: {
  formData: GigFormData
  imagePreviewUrls: string[]
}) {
  // Create genre map from constants
  const genreMap: { [key: string]: string } = {}
  GENRE_CATEGORIES.forEach(category => {
    genreMap[category.value] = category.label
  })
  
  // Find the selected genre label
  const selectedGenre = genreMap[formData.genre_category] || 'Unknown Genre'
  
  // Only show preview if we have some basic info
  if (!formData.title && !formData.description && imagePreviewUrls.length === 0) {
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
        {/* Preview Images */}
        {imagePreviewUrls.length > 0 ? (
          <div className="mb-4">
            <img
              src={imagePreviewUrls[0]}
              alt="Gig preview"
              className="w-full h-40 object-cover rounded-lg mb-2"
            />
            {imagePreviewUrls.length > 1 && (
              <div className="flex gap-2">
                {imagePreviewUrls.slice(1).map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Preview ${index + 2}`}
                    className="w-16 h-16 object-cover rounded"
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-500 text-sm">No images uploaded</span>
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
            <h4 className="text-sm font-medium text-gray-700 mb-2">What you&apos;ll get:</h4>
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

