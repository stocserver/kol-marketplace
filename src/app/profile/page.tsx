'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useRole } from '@/contexts/RoleContext'
import { PLATFORMS, INDUSTRIES } from '@/lib/constants'

interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url?: string
  cover_image?: string
  bio?: string
  user_type: 'kol' | 'sponsor'
  country?: string
  languages?: string[]
  // KOL specific fields
  platforms?: {
    [key: string]: { followers: number; avg_views_per_post: number }
  }
  avg_views_per_content?: number
  // Sponsor specific fields
  company_size?: string
  industry?: string
  website?: string
  total_campaigns?: number
  total_spent?: number
  // System fields
  created_at?: string
  updated_at?: string
  // Stripe fields (existing in DB)
  stripe_account_id?: string
  stripe_onboarding_complete?: boolean
  stripe_charges_enabled?: boolean
  stripe_payouts_enabled?: boolean
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    user_type: 'kol' as 'kol' | 'sponsor',
    country: '',
    // KOL fields
    languages: [] as string[],
    platforms: {} as { [key: string]: { followers: number; avg_views_per_post: number } },
    // Sponsor fields
    company_size: '',
    industry: '',
    website: ''
  })
  const [customPlatform, setCustomPlatform] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const { theme } = useRole()
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      try {
        // Check localStorage for auth data
        const authKeys = Object.keys(localStorage).filter(key => 
          key.includes('supabase.auth.token')
        )
        
        if (authKeys.length === 0) {
          router.push('/login')
          return
        }

        // Get user data from localStorage
        let userId = null
        for (const key of authKeys) {
          try {
            const authData = localStorage.getItem(key)
            if (authData) {
              const parsed = JSON.parse(authData)
              if (parsed.user?.id) {
                userId = parsed.user.id
                break
              }
            }
          } catch {
            console.warn('Failed to parse auth data')
          }
        }

        if (!userId) {
          router.push('/login')
          return
        }

        // Load profile using direct REST API
        const profileResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Content-Type': 'application/json'
            }
          }
        )

        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          if (profileData.length > 0) {
            const profile = profileData[0]
            setProfile(profile)
            setFormData({
              username: profile.username,
              full_name: profile.full_name,
              bio: profile.bio || '',
              user_type: profile.user_type,
              country: profile.country || '',
              languages: profile.languages || [],
              platforms: profile.platforms || {},
              company_size: profile.company_size || '',
              industry: profile.industry || '',
              website: profile.website || ''
            })
          }
        }

        setLoading(false)
      } catch (error) {
        console.error('Profile: Error loading profile:', error)
        router.push('/login')
      }
    }

    loadProfile()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Start with basic fields only, then progressively add enhanced fields
      let profileData: any = {
        id: user.id,
        full_name: formData.full_name,
        user_type: formData.user_type
      }

      // Only include username for new profiles (when profile doesn't exist yet)
      if (!profile) {
        profileData.username = formData.username
      }

      // Try to add enhanced fields if they exist
      // We'll add them one by one to see which ones work
      if (formData.bio) {
        profileData.bio = formData.bio
      }
      
      if (formData.country) {
        profileData.country = formData.country
      }
      
      if (formData.languages && formData.languages.length > 0) {
        profileData.languages = formData.languages
      }

      // KOL specific fields
      if (formData.user_type === 'kol') {
        if (Object.keys(formData.platforms).length > 0) {
          profileData.platforms = formData.platforms
        }
      }

      // Sponsor specific fields  
      if (formData.user_type === 'sponsor') {
        if (formData.company_size) {
          profileData.company_size = formData.company_size
        }
        if (formData.industry) {
          profileData.industry = formData.industry
        }
        if (formData.website) {
          profileData.website = formData.website
        }
      }

      console.log('Profile data being sent:', profileData)
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()

      console.log('Supabase response data:', data)
      console.log('Supabase error:', error)

      if (error) {
        console.error('Database update failed:', error)
        if (error.code === '23505') {
          setError('Username is already taken. Please choose a different username.')
        } else if (error.code === '23514') {
          setError('Please check your input values. Some fields may not meet the requirements.')
        } else {
          setError(`Database error: ${error.message}`)
        }
        return
      }

      if (data) {
        console.log('✅ Profile successfully updated:', data)
        setSuccessMessage('✅ Profile updated successfully! Redirecting...')
        // Add a delay to show success message before redirect
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } else {
        console.warn('⚠️ No data returned from upsert operation')
        setError('Profile update may not have been saved. Please try again.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Constants for select options
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


  const COMPANY_SIZES = [
    '1-10 employees', '11-50 employees', '51-200 employees', 
    '201-500 employees', '500+ employees'
  ]

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }))
  }

  const updatePlatform = (platform: string, field: 'followers' | 'avg_views_per_post', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platform]: {
          ...prev.platforms[platform],
          [field]: Number(value) || 0
        }
      }
    }))
  }

  const addCustomPlatform = () => {
    if (customPlatform.trim() && !formData.platforms[customPlatform]) {
      setFormData(prev => ({
        ...prev,
        platforms: {
          ...prev.platforms,
          [customPlatform.trim()]: {
            followers: 0,
            avg_views_per_post: 0
          }
        }
      }))
      setCustomPlatform('')
    }
  }

  const removePlatform = (platform: string) => {
    setFormData(prev => {
      const newPlatforms = { ...prev.platforms }
      delete newPlatforms[platform]
      return {
        ...prev,
        platforms: newPlatforms
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 lg:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-8 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              {profile ? 'Edit Profile' : 'Complete Your Profile'}
            </h1>
            {profile && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Your username is permanently set to maintain consistent profile links and brand identity.
                </p>
              </div>
            )}
            <p className="mt-2 text-gray-600">
              Fill out your comprehensive profile information to showcase your expertise and connect with the right partners.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-8">
            <div className="space-y-8">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Username *
                    </label>
                    <input
                      type="text"
                      id="username"
                      required
                      pattern="[a-zA-Z0-9_]+"
                      title="Username can only contain letters, numbers and underscores"
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none ${
                        profile 
                          ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      value={formData.username}
                      onChange={(e) => !profile && setFormData({ ...formData, username: e.target.value })}
                      disabled={!!profile}
                      readOnly={!!profile}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      {profile 
                        ? '🔒 Username cannot be changed after account creation'
                        : 'Letters, numbers and underscores only'
                      }
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell others about yourself..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <select
                      id="country"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    >
                      <option value="">Select Country</option>
                      {COUNTRIES.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Account Type */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="relative flex cursor-pointer rounded-lg border border-gray-300 p-4 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
                    <input
                      type="radio"
                      name="user_type"
                      value="kol"
                      checked={formData.user_type === 'kol'}
                      onChange={(e) => setFormData({ ...formData, user_type: e.target.value as 'kol' | 'sponsor' })}
                      className="sr-only"
                    />
                    <div className="flex flex-1">
                      <div className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">
                          👑 KOL (Key Opinion Leader)
                        </span>
                        <span className="mt-1 flex items-center text-sm text-gray-500">
                          Create and offer services to brands
                        </span>
                      </div>
                    </div>
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 ${formData.user_type === 'kol' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'}`}>
                      {formData.user_type === 'kol' && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </label>

                  <label className="relative flex cursor-pointer rounded-lg border border-gray-300 p-4 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
                    <input
                      type="radio"
                      name="user_type"
                      value="sponsor"
                      checked={formData.user_type === 'sponsor'}
                      onChange={(e) => setFormData({ ...formData, user_type: e.target.value as 'kol' | 'sponsor' })}
                      className="sr-only"
                    />
                    <div className="flex flex-1">
                      <div className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">
                          💼 Sponsor/Brand
                        </span>
                        <span className="mt-1 flex items-center text-sm text-gray-500">
                          Browse and purchase KOL services
                        </span>
                      </div>
                    </div>
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 ${formData.user_type === 'sponsor' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                      {formData.user_type === 'sponsor' && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </label>
                </div>
              </div>

              {/* KOL Specific Fields */}
              {formData.user_type === 'kol' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">KOL Information</h2>
                  <div className="space-y-6">

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Languages</label>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 border border-gray-300 rounded-md">
                        {LANGUAGES.map(language => (
                          <button
                            key={language}
                            type="button"
                            onClick={() => handleLanguageToggle(language)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              formData.languages.includes(language)
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {language}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Platform Statistics</label>
                      <div className="space-y-4">
                        {/* Default Platforms */}
                        {PLATFORMS.map(platform => (
                          <div key={platform} className="grid grid-cols-4 gap-4 items-center p-3 bg-gray-50 rounded-md">
                            <div className="font-medium text-gray-900">{platform}</div>
                            <div>
                              <input
                                type="number"
                                placeholder="Followers"
                                min="0"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                value={formData.platforms[platform]?.followers || ''}
                                onChange={(e) => updatePlatform(platform, 'followers', e.target.value)}
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                placeholder="Avg views per post"
                                min="0"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                value={formData.platforms[platform]?.avg_views_per_post || ''}
                                onChange={(e) => updatePlatform(platform, 'avg_views_per_post', e.target.value)}
                              />
                            </div>
                            <div>
                              {formData.platforms[platform] && (
                                <button
                                  type="button"
                                  onClick={() => removePlatform(platform)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Custom Platforms */}
                        {Object.entries(formData.platforms).map(([platform, stats]) => {
                          if (PLATFORMS.includes(platform)) return null // Skip default platforms
                          return (
                            <div key={platform} className="grid grid-cols-4 gap-4 items-center p-3 bg-blue-50 rounded-md">
                              <div className="font-medium text-gray-900">{platform}</div>
                              <div>
                                <input
                                  type="number"
                                  placeholder="Followers"
                                  min="0"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  value={stats.followers || ''}
                                  onChange={(e) => updatePlatform(platform, 'followers', e.target.value)}
                                />
                              </div>
                              <div>
                                <input
                                  type="number"
                                  placeholder="Avg views per post"
                                  min="0"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  value={stats.avg_views_per_post || ''}
                                  onChange={(e) => updatePlatform(platform, 'avg_views_per_post', e.target.value)}
                                />
                              </div>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => removePlatform(platform)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )
                        })}
                        
                        {/* Add Custom Platform */}
                        <div className="p-3 bg-green-50 rounded-md">
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Add custom platform (e.g., Snapchat, Pinterest)"
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded"
                              value={customPlatform}
                              onChange={(e) => setCustomPlatform(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomPlatform())}
                            />
                            <button
                              type="button"
                              onClick={addCustomPlatform}
                              className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sponsor Specific Fields */}
              {formData.user_type === 'sponsor' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                        Industry
                      </label>
                      <select
                        id="industry"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      >
                        <option value="">Select Industry</option>
                        {INDUSTRIES.map(industry => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="company_size" className="block text-sm font-medium text-gray-700">
                        Company Size
                      </label>
                      <select
                        id="company_size"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.company_size}
                        onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                      >
                        <option value="">Select Company Size</option>
                        {COMPANY_SIZES.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                        Website
                      </label>
                      <input
                        type="url"
                        id="website"
                        placeholder="https://your-website.com"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-sm text-green-600">{successMessage}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  💡 You can switch between KOL and Sponsor modes anytime using the toggle in the header.
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${theme.primary} ${theme.primaryHover} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {saving ? 'Saving...' : profile ? 'Update Profile' : 'Complete Profile'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}