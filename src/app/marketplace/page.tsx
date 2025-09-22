'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/contexts/RoleContext'
import { useAuth } from '@/hooks/useAuth'
import { useFavorites } from '@/hooks/useFavorites'
import { GENRE_CATEGORIES } from '@/lib/constants'
import KOLRating from '@/components/reviews/KOLRating'

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
  { label: 'Default', value: 'default' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Best rated', value: 'rating' },
  { label: 'Most reviewed', value: 'review_count' }
]

// Note: Mock data removed - now using real database data

export default function MarketplacePage() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedViewRange, setSelectedViewRange] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [selectedRating, setSelectedRating] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [loading, setLoading] = useState(true)
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
    if (sortBy !== 'default') {
      filtered.sort((a, b) => {
        switch (sortBy) {
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
            return 0 // No sorting for default
        }
      })
    }

    setFilteredGigs(filtered)
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
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Service Marketplace</h1>
          <p className="text-gray-600 mb-6">Discover amazing services from talented KOLs</p>
          
          {/* Search and Back Button */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            />
            <Link
              href="/dashboard"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
            >
              Back to Dashboard
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
              
              {/* Top Row - Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Category Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Country Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country/Region</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">All Countries</option>
                    {COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                {/* View Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Average Views</label>
                  <select
                    value={selectedViewRange}
                    onChange={(e) => setSelectedViewRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    {VIEW_RANGES.map(range => (
                      <option key={range.label} value={range.label}>{range.label}</option>
                    ))}
                  </select>
                </div>

                {/* Clear All Button */}
                <div className="flex items-end">
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
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>

              {/* Platform Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_CONFIG.map(platform => (
                    <button
                      key={platform.name}
                      onClick={() => togglePlatform(platform.name)}
                      className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedPlatforms.includes(platform.name)
                          ? `${platform.color} ring-2 ring-offset-2 ring-blue-500 shadow-md`
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      <span className="mr-2">{platform.logo}</span>
                      {platform.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Languages</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-lg border">
                  {LANGUAGES.map(language => (
                    <button
                      key={language}
                      onClick={() => toggleLanguage(language)}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        selectedLanguages.includes(language)
                          ? 'bg-purple-500 text-white shadow-md ring-2 ring-purple-200'
                          : 'bg-white hover:bg-purple-50 text-gray-700 border border-gray-200 hover:border-purple-200'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Minimum Rating</label>
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {RATING_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters Bar */}
            {(selectedCategory || selectedPlatforms.length > 0 || selectedViewRange || selectedCountry || selectedLanguages.length > 0 || selectedRating) && (
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Active filters:</span>
                  {selectedCategory && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                      📁 {selectedCategory}
                      <button
                        onClick={() => setSelectedCategory('')}
                        className="ml-2 text-blue-200 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedPlatforms.map(platform => {
                    const platformData = PLATFORM_CONFIG.find(p => p.name === platform)
                    return (
                      <span key={platform} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                        <span className="mr-1">{platformData?.logo}</span>
                        {platform}
                        <button
                          onClick={() => togglePlatform(platform)}
                          className="ml-2 text-green-200 hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                  {selectedViewRange && selectedViewRange !== 'Any' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-500 text-white">
                      👁️ {selectedViewRange}
                      <button
                        onClick={() => setSelectedViewRange('')}
                        className="ml-2 text-teal-200 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedCountry && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-500 text-white">
                      🌍 {selectedCountry}
                      <button
                        onClick={() => setSelectedCountry('')}
                        className="ml-2 text-orange-200 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedLanguages.map(language => (
                    <span key={language} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500 text-white">
                      💬 {language}
                      <button
                        onClick={() => toggleLanguage(language)}
                        className="ml-2 text-purple-200 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {selectedRating && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">
                      ⭐ {selectedRating}+ stars
                      <button
                        onClick={() => setSelectedRating('')}
                        className="ml-2 text-yellow-200 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredGigs.length} of {gigs.length} services
              </p>
            </div>
            
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredGigs.map((gig) => (
                <div key={gig.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Clickable Gig Image */}
                  <Link href={`/gigs/${gig.id}`}>
                    <div className="aspect-[4/3] bg-gray-200 relative cursor-pointer">
                      {gig.preview_image_url ? (
                        <img
                          src={gig.preview_image_url}
                          alt={gig.title}
                          className="w-full h-full object-cover"
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

                    {/* Platform Tags */}
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
                    
                    {/* Location & Language Info */}
                    <div className="flex flex-wrap gap-1 mb-2">
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

                    {/* Rating */}
                    <div className="mb-2">
                      <KOLRating kolId={gig.kol_id} size="sm" />
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
          </div>
        )}
      </div>
    </div>
  )
}