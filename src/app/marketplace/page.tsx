'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/contexts/RoleContext'
import { useAuth } from '@/hooks/useAuth'
import { useFavorites } from '@/hooks/useFavorites'
import { GENRE_CATEGORIES } from '@/lib/constants'
import KOLRating from '@/components/reviews/KOLRating'
import { useSearch } from '@/contexts/SearchContext'

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
  created_at: string
  kol_id: string
  kol: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
    country?: string
    languages?: string[]
  }
}

// Use categories from shared constants
const CATEGORIES = GENRE_CATEGORIES.map(cat => cat.label)

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

const VIEW_RANGES = [
  { label: 'Any', min: 0, max: Infinity },
  { label: '1K - 10K', min: 1000, max: 10000 },
  { label: '10K - 50K', min: 10000, max: 50000 },
  { label: '50K - 100K', min: 50000, max: 100000 },
  { label: '100K+', min: 100000, max: Infinity }
]

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 
  'France', 'Italy', 'Spain', 'Netherlands', 'Sweden', 'Norway', 'Denmark',
  'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Thailand', 'Philippines',
  'Brazil', 'Mexico', 'Argentina', 'India', 'Indonesia', 'Vietnam'
]

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
  'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Japanese', 'Korean',
  'Mandarin', 'Cantonese', 'Thai', 'Tagalog', 'Malay', 'Indonesian',
  'Vietnamese', 'Hindi', 'Arabic'
]

const RATING_OPTIONS = [
  { label: 'Any rating', value: '' },
  { label: '4+ stars', value: '4' },
  { label: '3+ stars', value: '3' },
  { label: '2+ stars', value: '2' },
  { label: '1+ stars', value: '1' }
]

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Best Rated', value: 'rating' },
  { label: 'Most Reviewed', value: 'review_count' }
]

// Note: Mock data removed - now using real database data

export default function MarketplacePage() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>([])
  const { searchTerm, setSearchTerm } = useSearch()
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedViewRange, setSelectedViewRange] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [selectedRating, setSelectedRating] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(true)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 24
  const { user } = useAuth()
  const { theme } = useRole()
  const { toggleFavorite, isFavorited } = useFavorites()
  const supabase = createClient()

  // Fetch gigs from database
  useEffect(() => {
    const fetchGigs = async () => {
      try {
        setLoading(true)
        
        const { data, error } = await supabase
          .from('gigs')
          .select(`
            *,
            kol:profiles!gigs_kol_id_fkey(
              id,
              username,
              full_name,
              avatar_url,
              country,
              languages
            )
          `)
          .eq('is_active', true)
          .eq('approval_status', 'approved')
          .order('created_at', { ascending: false })

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

    fetchGigs()
  }, [supabase])

  const togglePlatform = (platformName: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformName)
        ? prev.filter(p => p !== platformName)
        : [...prev, platformName]
    )
  }

  const toggleLanguage = (languageName: string) => {
    setSelectedLanguages(prev =>
      prev.includes(languageName)
        ? prev.filter(l => l !== languageName)
        : [...prev, languageName]
    )
  }

  const handleToggleFavorite = async (gigId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      alert('Please log in to favorite gigs')
      return
    }
    
    await toggleFavorite(gigId)
  }



  // Store KOL ratings data
  const [kolRatings, setKolRatings] = useState<Record<string, { average: number; count: number }>>({})

  // Fetch ratings for all KOLs
  useEffect(() => {
    const fetchAllRatings = async () => {
      if (gigs.length === 0) return

      const kolIds = [...new Set(gigs.map(gig => gig.kol_id))]
      const ratingsData: Record<string, { average: number; count: number }> = {}

      try {
        const { data: reviews, error } = await supabase
          .from('reviews')
          .select('kol_id, rating')
          .in('kol_id', kolIds)

        if (error) {
          console.warn('Error fetching ratings:', error)
          return
        }

        // Calculate averages for each KOL
        kolIds.forEach(kolId => {
          const kolReviews = reviews.filter(review => review.kol_id === kolId)
          if (kolReviews.length > 0) {
            const average = kolReviews.reduce((sum, review) => sum + review.rating, 0) / kolReviews.length
            ratingsData[kolId] = {
              average: Math.round(average * 10) / 10,
              count: kolReviews.length
            }
          } else {
            ratingsData[kolId] = { average: 0, count: 0 }
          }
        })

        setKolRatings(ratingsData)
      } catch (error) {
        console.warn('Error calculating ratings:', error)
      }
    }

    fetchAllRatings()
  }, [gigs, supabase])

  useEffect(() => {
    let filtered = gigs

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(gig =>
        gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gig.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(gig => gig.genre_category === selectedCategory)
    }

    // Filter by platforms
    if (selectedPlatforms.length > 0) {
      filtered = filtered.filter(gig =>
        selectedPlatforms.includes(gig.platform)
      )
    }

    // Filter by view range - using KOL's average views from profile
    if (selectedViewRange) {
      const range = VIEW_RANGES.find(r => r.label === selectedViewRange)
      if (range) {
        // For now, we'll skip view filtering since we don't have view data in gigs table
        // This would need to be joined with KOL profile data or added to gigs table
      }
    }

    // Filter by country
    if (selectedCountry) {
      filtered = filtered.filter(gig => gig.kol?.country === selectedCountry)
    }

    // Filter by languages
    if (selectedLanguages.length > 0) {
      filtered = filtered.filter(gig =>
        selectedLanguages.some(language => gig.kol?.languages?.includes(language))
      )
    }

    // Filter by rating
    if (selectedRating) {
      const minRating = parseInt(selectedRating)
      filtered = filtered.filter(gig => {
        const rating = kolRatings[gig.kol_id]
        return rating && rating.average >= minRating
      })
    }

    // Sort the results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'price_asc':
          return Number(a.price) - Number(b.price) // Low to High: smaller numbers first
        case 'price_desc':
          return Number(b.price) - Number(a.price) // High to Low: larger numbers first
        case 'rating':
          const ratingA = kolRatings[a.kol_id]?.average || 0
          const ratingB = kolRatings[b.kol_id]?.average || 0
          return ratingB - ratingA
        case 'review_count':
          const countA = kolRatings[a.kol_id]?.count || 0
          const countB = kolRatings[b.kol_id]?.count || 0
          return countB - countA
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredGigs(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, selectedCategory, selectedPlatforms, selectedViewRange, selectedCountry, selectedLanguages, selectedRating, sortBy, gigs, kolRatings])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Service Marketplace</h1>
            <Link
              href="/dashboard"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
            >
              ← Dashboard
            </Link>
          </div>

          {/* Compact Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by service title, description, or KOL name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Platform */}
              <div className="flex flex-wrap gap-2">
                {PLATFORM_CONFIG.map(platform => (
                  <button
                    key={platform.name}
                    onClick={() => togglePlatform(platform.name)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      selectedPlatforms.includes(platform.name)
                        ? `${platform.color} ring-2 ring-blue-400`
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span>{platform.logo}</span>
                    <span>{platform.name}</span>
                  </button>
                ))}
              </div>

              {/* Country */}
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Countries</option>
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>

              {/* Language */}
              <select
                value={selectedLanguages[0] || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedLanguages([e.target.value])
                  } else {
                    setSelectedLanguages([])
                  }
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Languages</option>
                {LANGUAGES.map(language => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>

              {/* Rating */}
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {RATING_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Clear Button */}
              <button
                onClick={() => {
                  setSelectedCategory('')
                  setSelectedPlatforms([])
                  setSelectedViewRange('')
                  setSelectedCountry('')
                  setSelectedLanguages([])
                  setSelectedRating('')
                  setSortBy('default')
                }}
                className="ml-auto px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-md transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

        </div>

        {filteredGigs.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No services found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search terms or filters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pagination Info */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredGigs.length)} of {filteredGigs.length} services
              </p>
            </div>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredGigs
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((gig) => (
                <div key={gig.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col h-full">
                  {/* Clickable Gig Image */}
                  <Link href={`/gigs/${gig.id}`}>
                    <div className="aspect-[4/3] bg-gray-200 relative cursor-pointer">
                      {gig.preview_image_url ? (
                        <Image
                          src={gig.preview_image_url}
                          alt={gig.title}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover"
                          style={{objectFit: 'cover'}}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">No image</span>
                        </div>
                      )}
                      {/* Category Badge */}
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-white bg-opacity-90 text-gray-800">
                          {gig.genre_category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      {/* Favorite Button - only show for logged in users */}
                      {user && (
                        <button
                          onClick={(e) => handleToggleFavorite(gig.id, e)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 flex items-center justify-center transition-all"
                          title={isFavorited(gig.id) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <svg
                            className={`w-4 h-4 ${isFavorited(gig.id) ? 'text-red-400 fill-current' : 'text-white'}`}
                            fill={isFavorited(gig.id) ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </Link>

                  <div className="p-3 flex flex-col flex-grow">
                    {/* Title and KOL - Fixed height */}
                    <div className="mb-3 min-h-[60px]">
                      <Link href={`/gigs/${gig.id}`}>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors h-10">
                          {gig.title}
                        </h3>
                      </Link>
                      <Link href={`/profile/${gig.kol?.username || ''}`}>
                        <p className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 transition-colors">
                          @{gig.kol?.username || 'Unknown'}
                        </p>
                      </Link>
                    </div>

                    {/* Platform Tags - Fixed height */}
                    <div className="flex flex-wrap gap-1 mb-3 min-h-[24px]">
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

                    {/* Location & Language Info - Fixed height */}
                    <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
                      {gig.kol?.country && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                          🌍 {gig.kol.country}
                        </span>
                      )}
                      {gig.kol?.languages?.slice(0, 2).map(lang => (
                        <span key={lang} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          💬 {lang}
                        </span>
                      ))}
                      {gig.kol?.languages && gig.kol.languages.length > 2 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          +{gig.kol.languages.length - 2}
                        </span>
                      )}
                    </div>

                    {/* Rating - Fixed height */}
                    <div className="mb-2 min-h-[20px]">
                      <KOLRating kolId={gig.kol_id} size="sm" />
                    </div>

                    {/* Stats Row - Fixed height */}
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-3 min-h-[20px]">
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{gig.delivery_days}d delivery</span>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {gig.content_type}
                      </div>
                    </div>

                    {/* Spacer to push price and button to bottom */}
                    <div className="flex-grow"></div>

                    {/* Price - Fixed height */}
                    <div className="mb-3 min-h-[28px]">
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

            {/* Pagination Controls */}
            {filteredGigs.length > itemsPerPage && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.ceil(filteredGigs.length / itemsPerPage) }, (_, i) => i + 1)
                    .filter(page => {
                      const totalPages = Math.ceil(filteredGigs.length / itemsPerPage)
                      // Show first page, last page, current page, and pages around current
                      return page === 1 ||
                             page === totalPages ||
                             Math.abs(page - currentPage) <= 1
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there's a gap
                      const showEllipsisBefore = index > 0 && page - array[index - 1] > 1

                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsisBefore && <span className="px-2 text-gray-500">...</span>}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      )
                    })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredGigs.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(filteredGigs.length / itemsPerPage)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}