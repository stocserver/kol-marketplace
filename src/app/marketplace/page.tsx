'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/contexts/RoleContext'
import MessageButton from '@/components/MessageButton'

interface Gig {
  id: string
  title: string
  description: string
  price: number
  delivery_days: number
  category: string
  platforms: string[]
  image_url?: string
  avg_views_per_content: number
  country: string
  language: string[]
  social_links: {
    [platform: string]: string
  }
  kol_id: string
  kol: {
    username: string
    full_name: string
  }
}

const CATEGORIES = [
  'Fashion & Beauty',
  'Lifestyle',
  'Technology',
  'Food & Cooking',
  'Travel',
  'Fitness & Health',
  'Gaming',
  'Entertainment',
  'Business',
  'Education',
  'Art & Design',
  'Music'
]

const PLATFORMS = [
  {
    name: 'Instagram',
    logo: '📷',
    color: 'bg-pink-100 text-pink-800'
  },
  {
    name: 'TikTok',
    logo: '🎵',
    color: 'bg-black text-white'
  },
  {
    name: 'YouTube',
    logo: '▶️',
    color: 'bg-red-100 text-red-800'
  },
  {
    name: 'Twitter',
    logo: '🐦',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    name: 'LinkedIn',
    logo: '💼',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    name: 'Twitch',
    logo: '🎮',
    color: 'bg-purple-100 text-purple-800'
  }
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

// Mock data for demonstration
const mockGigs: Gig[] = [
  {
    id: '1',
    title: 'Instagram Reel + Story Package - Fashion Content Creation',
    description: 'Professional fashion content creation including 1 Instagram Reel (30-60s) and 2 Instagram Stories. Perfect for fashion brands looking to showcase their products with authentic styling.',
    price: 299,
    delivery_days: 3,
    category: 'Fashion & Beauty',
    platforms: ['Instagram'],
    country: 'United States',
    language: ['English', 'Spanish'],
    image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
    avg_views_per_content: 85000,
    social_links: {
      Instagram: 'https://instagram.com/fashionista_emma'
    },
    kol_id: 'kol1',
    kol: { username: 'fashionista_emma', full_name: 'Emma Rodriguez' }
  },
  {
    id: '2',
    title: 'TikTok Viral Video Creation',
    description: 'Create engaging TikTok content that resonates with your target audience. Includes trending audio, creative editing, and viral-worthy concepts.',
    price: 450,
    delivery_days: 2,
    category: 'Entertainment',
    platforms: ['TikTok'],
    country: 'Canada',
    language: ['English'],
    image_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
    avg_views_per_content: 120000,
    social_links: {
      TikTok: 'https://tiktok.com/@tiktok_creator_alex'
    },
    kol_id: 'kol2',
    kol: { username: 'tiktok_creator_alex', full_name: 'Alex Chen' }
  },
  {
    id: '3',
    title: 'YouTube Product Review & Unboxing',
    description: 'Comprehensive product review with professional unboxing, detailed analysis, and honest recommendations for your target audience.',
    price: 890,
    delivery_days: 5,
    category: 'Technology',
    platforms: ['YouTube'],
    country: 'United Kingdom',
    language: ['English'],
    image_url: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400',
    avg_views_per_content: 45000,
    social_links: {
      YouTube: 'https://youtube.com/@tech_reviewer_mike'
    },
    kol_id: 'kol3',
    kol: { username: 'tech_reviewer_mike', full_name: 'Mike Johnson' }
  },
  {
    id: '4',
    title: 'Multi-Platform Food Content Package',
    description: 'Complete food content package including Instagram posts, TikTok recipe videos, and YouTube cooking tutorials. Perfect for food brands and restaurants.',
    price: 650,
    delivery_days: 7,
    category: 'Food & Cooking',
    platforms: ['Instagram', 'TikTok', 'YouTube'],
    country: 'South Korea',
    language: ['Korean', 'English'],
    avg_views_per_content: 67000,
    social_links: {
      Instagram: 'https://instagram.com/chef_sarah',
      TikTok: 'https://tiktok.com/@chef_sarah',
      YouTube: 'https://youtube.com/@chef_sarah'
    },
    kol_id: 'kol4',
    kol: { username: 'chef_sarah', full_name: 'Sarah Kim' }
  },
  {
    id: '5',
    title: 'Fitness Motivation Content Series',
    description: 'Weekly fitness content series including workout videos, nutrition tips, and motivational posts across Instagram and TikTok.',
    price: 420,
    delivery_days: 4,
    category: 'Fitness & Health',
    platforms: ['Instagram', 'TikTok'],
    country: 'Australia',
    language: ['English'],
    image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    avg_views_per_content: 52000,
    social_links: {
      Instagram: 'https://instagram.com/fitness_coach_david',
      TikTok: 'https://tiktok.com/@fitness_coach_david'
    },
    kol_id: 'kol5',
    kol: { username: 'fitness_coach_david', full_name: 'David Wilson' }
  }
]

export default function MarketplacePage() {
  const [gigs, setGigs] = useState<Gig[]>(mockGigs)
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>(mockGigs)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedViewRange, setSelectedViewRange] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { theme } = useRole()

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

  const toggleFavorite = (gigId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorites(prev =>
      prev.includes(gigId)
        ? prev.filter(id => id !== gigId)
        : [...prev, gigId]
    )
  }


  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(0)}K`
    }
    return views.toString()
  }

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
      filtered = filtered.filter(gig => gig.category === selectedCategory)
    }

    // Filter by platforms
    if (selectedPlatforms.length > 0) {
      filtered = filtered.filter(gig =>
        selectedPlatforms.some(platform => gig.platforms?.includes(platform))
      )
    }

    // Filter by view range
    if (selectedViewRange) {
      const range = VIEW_RANGES.find(r => r.label === selectedViewRange)
      if (range) {
        filtered = filtered.filter(gig =>
          gig.avg_views_per_content >= range.min && gig.avg_views_per_content <= range.max
        )
      }
    }

    // Filter by country
    if (selectedCountry) {
      filtered = filtered.filter(gig => gig.country === selectedCountry)
    }

    // Filter by languages
    if (selectedLanguages.length > 0) {
      filtered = filtered.filter(gig =>
        selectedLanguages.some(language => gig.language?.includes(language))
      )
    }

    setFilteredGigs(filtered)
  }, [searchTerm, selectedCategory, selectedPlatforms, selectedViewRange, selectedCountry, selectedLanguages, gigs])

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
          <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
            <div className="space-y-6">
              {/* Category Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Platform Labels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(platform => (
                    <button
                      key={platform.name}
                      onClick={() => togglePlatform(platform.name)}
                      className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedPlatforms.includes(platform.name)
                          ? `${platform.color} ring-2 ring-blue-500`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span className="mr-2">{platform.logo}</span>
                      {platform.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* View Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Average Views</label>
                <select
                  value={selectedViewRange}
                  onChange={(e) => setSelectedViewRange(e.target.value)}
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {VIEW_RANGES.map(range => (
                    <option key={range.label} value={range.label}>{range.label}</option>
                  ))}
                </select>
              </div>

              {/* Country Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country/Region</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Countries</option>
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {/* Language Labels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Languages</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {LANGUAGES.map(language => (
                    <button
                      key={language}
                      onClick={() => toggleLanguage(language)}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedLanguages.includes(language)
                          ? 'bg-teal-100 text-teal-800 ring-2 ring-teal-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Filters */}
              {(selectedCategory || selectedPlatforms.length > 0 || selectedViewRange || selectedCountry || selectedLanguages.length > 0) && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {selectedCategory && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {selectedCategory}
                      <button
                        onClick={() => setSelectedCategory('')}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedPlatforms.map(platform => (
                    <span key={platform} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {platform}
                      <button
                        onClick={() => togglePlatform(platform)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {selectedViewRange && selectedViewRange !== 'Any' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                      Views: {selectedViewRange}
                      <button
                        onClick={() => setSelectedViewRange('')}
                        className="ml-2 text-teal-600 hover:text-teal-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedCountry && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {selectedCountry}
                      <button
                        onClick={() => setSelectedCountry('')}
                        className="ml-2 text-orange-600 hover:text-orange-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedLanguages.map(language => (
                    <span key={language} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {language}
                      <button
                        onClick={() => toggleLanguage(language)}
                        className="ml-2 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => {
                      setSelectedCategory('')
                      setSelectedPlatforms([])
                      setSelectedViewRange('')
                      setSelectedCountry('')
                      setSelectedLanguages([])
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
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
                      <img
                        src={gig.image_url || '/api/placeholder/300/225'}
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
                          {gig.category}
                        </span>
                      </div>
                      {/* Favorite Button */}
                      <button
                        onClick={(e) => toggleFavorite(gig.id, e)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 flex items-center justify-center transition-all"
                      >
                        <svg 
                          className={`w-4 h-4 ${favorites.includes(gig.id) ? 'text-red-400 fill-current' : 'text-white'}`} 
                          fill={favorites.includes(gig.id) ? 'currentColor' : 'none'} 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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
                      <Link href={`/profile/${gig.kol_id}`}>
                        <p className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 transition-colors">
                          @{gig.kol?.username || 'Unknown'}
                        </p>
                      </Link>
                    </div>

                    {/* Platform Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {gig.platforms?.slice(0, 2).map(platformName => {
                        const platform = PLATFORMS.find(p => p.name === platformName)
                        return platform ? (
                          <span
                            key={platformName}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${platform.color}`}
                          >
                            <span className="mr-1">{platform.logo}</span>
                            <span className="hidden sm:inline">{platform.name}</span>
                          </span>
                        ) : null
                      })}
                      {gig.platforms && gig.platforms.length > 2 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          +{gig.platforms.length - 2}
                        </span>
                      )}
                    </div>
                    
                    {/* Location & Language Info */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        🌍 {gig.country}
                      </span>
                      {gig.language?.slice(0, 2).map(lang => (
                        <span key={lang} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          💬 {lang}
                        </span>
                      ))}
                      {gig.language && gig.language.length > 2 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          +{gig.language.length - 2}
                        </span>
                      )}
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="font-medium">{formatViews(gig.avg_views_per_content)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {gig.delivery_days}d
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