'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/contexts/RoleContext'

interface Profile {
  id: string
  username: string
  full_name: string
  user_type: 'kol' | 'sponsor'
}

interface Gig {
  id: string
  title: string
  description: string
  price: number
  delivery_days: number
  is_active: boolean
  created_at: string
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const { currentRole, theme } = useRole()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function loadData() {
      try {
        // Instead of using Supabase auth, check localStorage directly
        const authKeys = Object.keys(localStorage).filter(key => 
          key.includes('supabase.auth.token') || key.includes('sb-') || key.includes('supabase-auth-token')
        )
        
        console.log('Dashboard: Found auth keys:', authKeys)
        
        if (authKeys.length === 0) {
          console.log('Dashboard: No auth data found, redirecting to login')
          router.push('/login')
          return
        }

        // Try to get user data from localStorage
        let userId = null
        let accessToken = null

        for (const key of authKeys) {
          try {
            const authData = localStorage.getItem(key)
            if (authData) {
              const parsed = JSON.parse(authData)
              if (parsed.user?.id) {
                userId = parsed.user.id
                accessToken = parsed.access_token
                break
              }
              if (parsed.id) { // Sometimes user data is at root level
                userId = parsed.id
                accessToken = parsed.access_token
                break
              }
            }
          } catch (e) {
            console.warn('Failed to parse auth data for key:', key)
          }
        }

        console.log('Dashboard: User ID from localStorage:', userId)

        if (!userId) {
          console.log('Dashboard: No user ID found, redirecting to login')
          router.push('/login')
          return
        }

        // Load profile using direct REST API call
        const profileResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${accessToken || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!profileResponse.ok) {
          console.error('Dashboard: Profile fetch failed:', profileResponse.status)
          router.push('/login')
          return
        }

        const profileData = await profileResponse.json()
        console.log('Dashboard: Profile data:', profileData)

        if (profileData.length === 0) {
          console.log('Dashboard: No profile found, redirecting to signup-complete')
          router.push('/signup-complete')
          return
        }

        setProfile(profileData[0])

        // Load gigs using direct REST API call
        const gigsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/gigs?kol_id=eq.${userId}&select=*&order=created_at.desc`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${accessToken || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (gigsResponse.ok) {
          const gigsData = await gigsResponse.json()
          console.log('Dashboard: Gigs data:', gigsData)
          setGigs(gigsData || [])
        } else {
          console.warn('Dashboard: Gigs fetch failed:', gigsResponse.status)
          setGigs([])
        }

        setLoading(false)
      } catch (error) {
        console.error('Dashboard: Error in loadData:', error)
        router.push('/login')
      }
    }

    loadData()
  }, [])

  const toggleGigStatus = async (gigId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('gigs')
      .update({ is_active: !currentStatus })
      .eq('id', gigId)

    if (!error) {
      setGigs(gigs.map(gig => 
        gig.id === gigId ? { ...gig, is_active: !currentStatus } : gig
      ))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">控制面板</h1>
          <p className="mt-2 text-gray-600">歡迎回來，{profile.full_name}</p>
        </div>

        {/* Current Role Display */}
        <div className="mb-8">
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${theme.accent} text-sm font-medium`}>
            {currentRole === 'kol' ? '👑 KOL 模式' : '💼 商家模式'}
          </div>
        </div>

        {/* KOL Dashboard */}
        {currentRole === 'kol' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">我的服務</h2>
              <Link
                href="/gigs/create"
                className={`${theme.primary} ${theme.primaryHover} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors`}
              >
                建立新服務
              </Link>
            </div>

            {gigs.length === 0 ? (
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">尚未建立服務</h3>
                <p className="mt-1 text-sm text-gray-500">
                  開始建立您的第一個服務項目
                </p>
                <div className="mt-6">
                  <Link
                    href="/gigs/create"
                    className={`${theme.primary} ${theme.primaryHover} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors`}
                  >
                    建立服務
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {gigs.map((gig) => (
                  <div key={gig.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {gig.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          gig.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {gig.is_active ? '已啟用' : '已停用'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {gig.description}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">價格:</span>
                        <span className="font-medium">NT${gig.price}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">交付時間:</span>
                        <span className="font-medium">{gig.delivery_days} 天</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link
                        href={`/gigs/${gig.id}/edit`}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium text-center transition-colors"
                      >
                        編輯
                      </Link>
                      <button
                        onClick={() => toggleGigStatus(gig.id, gig.is_active)}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          gig.is_active
                            ? 'bg-red-100 hover:bg-red-200 text-red-700'
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}
                      >
                        {gig.is_active ? '停用' : '啟用'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sponsor Dashboard */}
        {currentRole === 'sponsor' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">我的訂單</h2>
              <Link
                href="/marketplace"
                className={`${theme.primary} ${theme.primaryHover} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors`}
              >
                瀏覽服務
              </Link>
            </div>

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
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">尚無訂單</h3>
              <p className="mt-1 text-sm text-gray-500">
                開始瀏覽市場中的可用服務
              </p>
              <div className="mt-6">
                <Link
                  href="/marketplace"
                  className={`${theme.primary} ${theme.primaryHover} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors`}
                >
                  瀏覽市場
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}