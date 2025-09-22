'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/contexts/RoleContext'
import { useAuth } from '@/hooks/useAuth'
import GigHeader from '@/components/gig/GigHeader'
import GigGallery from '@/components/gig/GigGallery'
import GigDescription from '@/components/gig/GigDescription'
import GigSpecs from '@/components/gig/GigSpecs'
import OrderSummary from '@/components/gig/OrderSummary'
import KOLProfile from '@/components/gig/KOLProfile'
import SocialMediaLinks from '@/components/gig/SocialMediaLinks'
import ReviewsList from '@/components/reviews/ReviewsList'

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
  approval_status?: string
  is_active: boolean
  created_at: string
  kol_id: string
  kol: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    bio?: string
    country?: string
    languages?: string[]
    followers?: number
    avg_views_per_content?: number
    platforms?: any
  }
}

export default function GigDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [gig, setGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { theme } = useRole()
  const supabase = createClient()

  useEffect(() => {
    const fetchGig = async () => {
      if (!params.id) return
      
      try {
        setLoading(true)
        setError(null)
        
        const { data, error: fetchError } = await supabase
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
              followers,
              avg_views_per_content,
              platforms
            )
          `)
          .eq('id', params.id)
          .eq('is_active', true)
          .eq('approval_status', 'approved')
          .single()

        if (fetchError) {
          console.error('Error fetching gig:', fetchError)
          if (fetchError.code === 'PGRST116') {
            setError('Gig not found or not available')
          } else {
            setError('Failed to load gig details')
          }
          return
        }

        setGig(data as Gig)
      } catch (err) {
        console.error('Error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchGig()
  }, [params.id, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Gig Not Available</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors mr-4"
          >
            Go Back
          </button>
          <button
            onClick={() => router.push('/marketplace')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Browse All Gigs
          </button>
        </div>
      </div>
    )
  }

  if (!gig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
          <SocialMediaLinks socialLinks={gig.kol.platforms || {}} kolName={gig.kol.full_name} />
          <KOLProfile kol={gig.kol} />
          <ReviewsList kolId={gig.kol_id} showGigTitle={true} limit={5} />
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