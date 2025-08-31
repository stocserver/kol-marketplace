'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useFavorites } from '@/hooks/useFavorites'
import { useRole } from '@/contexts/RoleContext'
import { GENRE_CATEGORIES } from '@/lib/constants'

interface Gig {
  id: string
  title: string
  description: string
  price: number
  delivery_days: number
  platform: string
  content_type: string
  genre_category: string
  preview_image_url?: string
  created_at: string
  kol: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
  }
}

// Platform display configuration
const PLATFORM_CONFIG = [
  { name: 'Instagram', logo: '📷', color: 'bg-pink-100 text-pink-800' },
  { name: 'TikTok', logo: '🎵', color: 'bg-black text-white' },
  { name: 'YouTube', logo: '▶️', color: 'bg-red-100 text-red-800' },
  { name: 'Facebook', logo: '👥', color: 'bg-blue-100 text-blue-800' },
  { name: 'Twitter', logo: '🐦', color: 'bg-blue-100 text-blue-800' },
  { name: 'LinkedIn', logo: '💼', color: 'bg-blue-100 text-blue-800' },
  { name: 'Twitch', logo: '🎮', color: 'bg-purple-100 text-purple-800' },
  { name: 'Snapchat', logo: '👻', color: 'bg-yellow-100 text-yellow-800' },
  { name: 'Pinterest', logo: '📌', color: 'bg-red-100 text-red-800' }
]

export default function FavoritesPage() {
  const { user } = useAuth()
  const { getFavoriteGigs, toggleFavorite, isFavorited, loading } = useFavorites()
  const { theme } = useRole()
  const [favoriteGigs, setFavoriteGigs] = useState<Gig[]>([])
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setPageLoading(false)
        return
      }

      try {
        const gigs = await getFavoriteGigs()
        setFavoriteGigs(gigs)
      } catch (error) {
        console.error('Error loading favorite gigs:', error)
      } finally {
        setPageLoading(false)
      }
    }

    // Wait for favorites loading to complete
    if (!loading) {
      loadFavorites()
    }
  }, [user, loading, getFavoriteGigs])

  const handleRemoveFavorite = async (gigId: string) => {
    const success = await toggleFavorite(gigId)
    if (success) {
      setFavoriteGigs(prev => prev.filter(gig => gig.id !== gigId))
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h1>
          <p className="text-gray-600 mb-6">
            Please log in to view your favorite gigs.
          </p>
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    )
  }

  if (pageLoading || loading) {
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
              <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
              <p className="text-gray-600 mt-2">
                Your saved gigs ({favoriteGigs.length} items)
              </p>
            </div>
            <Link
              href="/marketplace"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Browse More</span>
            </Link>
          </div>
        </div>

        {/* Favorites Grid */}
        {favoriteGigs.length > 0 ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteGigs.map((gig) => (
              <div key={gig.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                {/* Gig Image */}
                <Link href={`/gigs/${gig.id}`}>
                  <div className="aspect-[4/3] bg-gray-200 relative cursor-pointer">
                    <img
                      src={gig.preview_image_url || '/api/placeholder/300/225'}
                      alt={gig.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/api/placeholder/300/225'
                      }}
                    />
                    {/* Category Badge */}
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-90 text-gray-800">
                        {gig.genre_category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    {/* Remove Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleRemoveFavorite(gig.id)
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all"
                      title="Remove from favorites"
                    >
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                </Link>

                <div className="p-3">
                  {/* Title and KOL */}
                  <div className="mb-3">
                    <Link href={`/gigs/${gig.id}`}>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors">
                        {gig.title}
                      </h3>
                    </Link>
                    <Link href={`/profile/${gig.kol?.username || ''}`}>
                      <p className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 transition-colors">
                        @{gig.kol?.username || 'Unknown'}
                      </p>
                    </Link>
                  </div>

                  {/* Platform Tag */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(() => {
                      const platform = PLATFORM_CONFIG.find(p => p.name === gig.platform)
                      return platform ? (
                        <span
                          key={gig.platform}
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${platform.color}`}
                        >
                          <span className="mr-1">{platform.logo}</span>
                          <span className="hidden sm:inline">{platform.name}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {gig.platform}
                        </span>
                      )
                    })()}
                  </div>
                  
                  {/* Stats Row */}
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{gig.delivery_days}d delivery</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {gig.content_type}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    <div className="text-lg font-bold text-green-600">
                      ${gig.price.toLocaleString()}
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <Link
                    href={`/gigs/${gig.id}`}
                    className={`block w-full ${theme.primary} ${theme.primaryHover} text-white text-center px-3 py-2 rounded-md text-sm font-medium transition-colors`}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Favorites Yet</h3>
            <p className="text-gray-600 mb-6">
              Start browsing the marketplace and save gigs you like!
            </p>
            <Link
              href="/marketplace"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Browse Marketplace</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}