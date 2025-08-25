'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/contexts/RoleContext'
import GigHeader from '@/components/gig/GigHeader'
import GigGallery from '@/components/gig/GigGallery'
import GigDescription from '@/components/gig/GigDescription'
import GigSpecs from '@/components/gig/GigSpecs'
import OrderSummary from '@/components/gig/OrderSummary'
import KOLProfile from '@/components/gig/KOLProfile'
import SocialMediaLinks from '@/components/gig/SocialMediaLinks'

// Mock data for testing
const mockGig = {
  id: '1',
  title: 'Instagram Reel + Story Package - Fashion Content Creation',
  description: 'I will create engaging Instagram content that showcases your fashion brand with authentic storytelling. My content drives real engagement and converts viewers into customers.',
  price: 299,
  delivery_days: 3,
  category: 'Fashion & Beauty',
  platforms: ['Instagram'],
  country: 'United States',
  language: ['English', 'Spanish'],
  avg_views_per_content: 85000,
  social_links: {
    Instagram: 'https://instagram.com/fashionista_emma'
  },
  content_type: 'video',
  deliverables: '1 Instagram Reel (15-30 seconds)\n1 Instagram Story (3-5 slides)\nHigh-resolution photos\nCaption writing\nHashtag research',
  requirements: 'Product samples or detailed brief\nBrand guidelines (colors, tone)\nSpecific messaging requirements\nAny hashtags or mentions needed',
  revisions_included: 2,
  fast_delivery: true,
  fast_delivery_days: 1,
  preview_image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
  kol: {
    id: 'kol1',
    username: 'fashionista_emma',
    full_name: 'Emma Rodriguez',
    profile_image: 'https://images.unsplash.com/photo-1494790108755-2616b352caf1?w=150',
    followers: 125000,
    rating: 4.8,
    total_orders: 47,
    response_time: '2 hours',
    bio: 'Fashion & lifestyle content creator with 125K engaged followers. Specializing in authentic brand partnerships and trendy content that converts.'
  }
}

export default function GigDetailPage() {
  const params = useParams()
  const [gig, setGig] = useState(mockGig) // Using mock data for now
  const [loading, setLoading] = useState(false)
  const { theme } = useRole()
  const supabase = createClient()

  // TODO: Replace with real API call later
  useEffect(() => {
    // const fetchGig = async () => {
    //   setLoading(true)
    //   const { data, error } = await supabase
    //     .from('gigs')
    //     .select(`
    //       *,
    //       profiles:kol_id (
    //         id, username, full_name, profile_image
    //       )
    //     `)
    //     .eq('id', params.id)
    //     .single()
    //   
    //   if (data) setGig(data)
    //   setLoading(false)
    // }
    // fetchGig()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!gig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Gig not found</h1>
          <p className="text-gray-600 mt-2">The gig you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <GigHeader gig={gig} />
          <GigGallery gig={gig} />
          <GigDescription gig={gig} />
          <GigSpecs gig={gig} />
          <SocialMediaLinks socialLinks={gig.social_links} kolName={gig.kol.full_name} />
          <KOLProfile kol={gig.kol} />
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <OrderSummary gig={gig} />
          </div>
        </div>
      </div>
    </div>
  )
}