'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/contexts/RoleContext'
import { useAuth } from '@/hooks/useAuth'
import KOLProfile from '@/components/profile/KOLProfile'
import SponsorProfile from '@/components/profile/SponsorProfile'

export default function ProfilePage() {
  const params = useParams()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const { theme } = useRole()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        setError('')
        
        console.log('Searching for username:', params.username)
        
        // Fetch real profile data from database by username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', params.username)
          .single()

        console.log('Profile data fetched:', profileData)
        console.log('Profile error:', profileError)

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          
          if (profileError.code === 'PGRST116') {
            setError('Profile not found - no user exists with this username')
          } else if (profileError.code === '42501' || profileError.message?.includes('permission')) {
            setError('Permission denied - unable to access this profile')
          } else {
            setError(`Profile error: ${profileError.message || 'Unknown database error'}`)
          }
          setLoading(false)
          return
        }

        if (!profileData) {
          setError('Profile not found')
          setLoading(false)
          return
        }

        // Fetch user's published gigs if they are a KOL
        let userGigs = []
        if (profileData.user_type === 'kol') {
          const { data: gigsData, error: gigsError } = await supabase
            .from('gigs')
            .select('*')
            .eq('kol_id', profileData.id)
            .eq('is_active', true)
            .eq('approval_status', 'approved')
            .order('created_at', { ascending: false })

          if (!gigsError && gigsData) {
            userGigs = gigsData
            console.log('Fetched gigs:', gigsData)
          } else {
            console.error('Error fetching gigs:', gigsError)
          }
        }

        // Transform database data to match component expectations
        const transformedUser = {
          id: profileData.id,
          type: profileData.user_type,
          username: profileData.username,
          full_name: profileData.full_name,
          profile_image: profileData.avatar_url || '/api/placeholder/300/300',
          cover_image: profileData.cover_image || '/api/placeholder/1200/300',
          bio: profileData.bio || 'No bio provided yet.',
          followers: profileData.followers || 0,
          rating: 4.8, // TODO: Calculate from actual reviews
          total_orders: 0, // TODO: Count from actual orders
          member_since: profileData.created_at,
          languages: profileData.languages || [],
          platforms: profileData.platforms || {},
          // Sponsor specific fields
          company_size: profileData.company_size,
          industry: profileData.industry,
          website: profileData.website,
          total_campaigns: profileData.total_campaigns || 0,
          total_spent: profileData.total_spent || 0,
          // Real gigs data
          gigs: userGigs.map(gig => ({
            id: gig.id,
            title: gig.title,
            price: gig.price,
            image: gig.preview_image_url || '/api/placeholder/500/300',
            rating: 4.8, // TODO: Calculate from actual reviews
            orders: 0, // TODO: Count from actual orders
            delivery_days: gig.delivery_days
          })),
          reviews: [], // TODO: Fetch actual reviews
          recent_work: [], // TODO: Fetch actual work samples
          recent_orders: [], // TODO: Fetch actual orders for sponsors
          favorite_kols: [], // TODO: Fetch actual favorites for sponsors
          avg_views_per_content: profileData.avg_views_per_content || 0
        }

        setUser(transformedUser)
      } catch (err) {
        console.error('Error in loadProfile:', err)
        setError('An error occurred while loading the profile')
      } finally {
        setLoading(false)
      }
    }

    if (params.username) {
      loadProfile()
    }
  }, [params.username, supabase])

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
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Profile Error</h1>
          <p className="text-gray-600 mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Profile not found</h1>
          <p className="text-gray-600 mt-2">The profile you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user.type === 'kol' ? (
        <KOLProfile user={user} />
      ) : (
        <SponsorProfile user={user} />
      )}
    </div>
  )
}