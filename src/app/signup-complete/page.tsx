'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { triggerAuthRefresh } from '@/hooks/useAuth'

export default function SignupCompletePage() {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [userType, setUserType] = useState<'kol' | 'sponsor'>('kol')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Check if profile already exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        router.push('/dashboard')
        return
      }

      // Pre-fill with Google data if available
      if (user.user_metadata?.full_name) {
        setFullName(user.user_metadata.full_name)
      }
      if (user.user_metadata?.email) {
        setUsername(user.user_metadata.email.split('@')[0])
      }
    }

    checkProfile()
  }, [supabase, router])

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('Signup form: Starting submission', { userType, username, fullName })

    try {
      console.log('Signup form: Making API request')
      const response = await fetch('/api/auth/signup-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userType,
          username,
          fullName,
        }),
      })

      console.log('Signup form: Response received', { status: response.status, ok: response.ok })

      const result = await response.json()
      console.log('Signup form: Response data', result)

      if (result.error) {
        console.log('Signup form: Error in response', result.error)
        setError(result.error)
      } else {
        console.log('Signup form: Success, redirecting to dashboard')
        // Trigger auth refresh to update header
        triggerAuthRefresh()
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Signup form: Exception', err)
      setError('完成註冊時發生錯誤')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">完成註冊</h1>
          <p className="mt-2 text-gray-600">
            請完成您的個人資料設定
          </p>
        </div>
        
        <form onSubmit={handleComplete} className="space-y-3 sm:space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="userType" className="block text-sm font-medium text-gray-700">用戶類型</label>
            <select
              id="userType"
              value={userType}
              onChange={(e) => setUserType(e.target.value as 'kol' | 'sponsor')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="kol">KOL (意見領袖)</option>
              <option value="sponsor">商家</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">姓名</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">用戶名稱</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '註冊中...' : '完成註冊'}
          </button>
        </form>
      </div>
    </div>
  )
}