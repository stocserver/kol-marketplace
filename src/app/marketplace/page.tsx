'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/contexts/RoleContext'

interface Gig {
  id: string
  title: string
  description: string
  price: number
  delivery_days: number
  kol: {
    username: string
    full_name: string
  }
}

export default function MarketplacePage() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const { theme } = useRole()
  const supabase = createClient()

  useEffect(() => {
    async function loadGigs() {
      const { data: gigsData } = await supabase
        .from('gigs')
        .select(`
          *,
          kol:profiles(username, full_name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      setGigs(gigsData || [])
      setFilteredGigs(gigsData || [])
      setLoading(false)
    }

    loadGigs()
  }, [supabase])

  useEffect(() => {
    const filtered = gigs.filter(gig =>
      gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredGigs(filtered)
  }, [searchTerm, gigs])

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">服務市場</h1>
          <p className="text-gray-600 mb-6">發現來自優秀 KOL 的精彩服務</p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="搜尋服務..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            />
            <Link
              href="/dashboard"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
            >
              返回控制面板
            </Link>
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
              {searchTerm ? '找不到服務' : '目前沒有可用服務'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? '請嘗試調整搜尋條件' 
                : '請稍後再查看新服務'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGigs.map((gig) => (
              <div key={gig.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6">
                <div className="mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {gig.title}
                  </h3>
                  <p className="text-sm text-blue-600 mb-3">
                    by @{gig.kol?.username || 'Unknown'}
                  </p>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {gig.description}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    NT${gig.price.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    {gig.delivery_days} 天交付
                  </div>
                </div>
                
                <Link
                  href={`/gigs/${gig.id}`}
                  className={`block w-full ${theme.primary} ${theme.primaryHover} text-white text-center px-4 py-2 rounded-md text-sm font-medium transition-colors`}
                >
                  查看詳情
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}