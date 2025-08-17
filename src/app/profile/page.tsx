'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useRole } from '@/contexts/RoleContext'

interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url?: string
  user_type: 'kol' | 'sponsor'
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    user_type: 'kol' as 'kol' | 'sponsor'
  })
  const [error, setError] = useState('')
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
              user_type: profile.user_type
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

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const profileData = {
        id: user.id,
        username: formData.username,
        full_name: formData.full_name,
        user_type: formData.user_type
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData)

      if (error) {
        if (error.code === '23505') {
          setError('用戶名已被使用。請選擇不同的用戶名。')
        } else {
          setError(error.message)
        }
        return
      }

      router.push('/dashboard')
    } catch {
      setError('發生未預期的錯誤')
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

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 lg:py-12">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            {profile ? '編輯個人資料' : '完成個人資料'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                姓名
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
                用戶名稱
              </label>
              <input
                type="text"
                id="username"
                required
                pattern="[a-zA-Z0-9_]+"
                title="用戶名稱只能包含字母、數字和底線"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
              <p className="mt-1 text-sm text-gray-500">
                只允許字母、數字和底線
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                主要帳戶類型
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="user_type"
                    value="kol"
                    checked={formData.user_type === 'kol'}
                    onChange={(e) => setFormData({ ...formData, user_type: e.target.value as 'kol' | 'sponsor' })}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                  />
                  <span className="ml-3 block text-sm text-gray-900">
                    <strong className="text-purple-600">👑 KOL (意見領袖)</strong>
                    <span className="block text-gray-500">建立並提供服務給商家</span>
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="user_type"
                    value="sponsor"
                    checked={formData.user_type === 'sponsor'}
                    onChange={(e) => setFormData({ ...formData, user_type: e.target.value as 'kol' | 'sponsor' })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-3 block text-sm text-gray-900">
                    <strong className="text-blue-600">💼 商家</strong>
                    <span className="block text-gray-500">瀏覽並購買 KOL 的服務</span>
                  </span>
                </label>
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>💡 彈性帳戶：</strong> 您可以隨時使用標題中的切換按鈕在 KOL 和商家模式之間切換。此設定只是決定您的預設模式。
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${theme.primary} ${theme.primaryHover} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? '儲存中...' : profile ? '更新個人資料' : '完成個人資料'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}