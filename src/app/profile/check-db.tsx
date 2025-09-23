'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'

export default function CheckDbPage() {
  const [profileData, setProfileData] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const supabase = createClient()

  const loadCurrentProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      console.log('Current user ID:', user.id)

      // Try to get the profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      console.log('Profile query result:', { data, error })

      if (error) {
        setError(`Database error: ${error.message}`)
      } else {
        setProfileData(data)
      }
    } catch (err) {
      console.error('Catch error:', err)
      setError(`Unexpected error: ${err}`)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const refreshData = () => {
    setLoading(true)
    setError('')
    setProfileData(null)
    loadCurrentProfile()
  }

  useEffect(() => {
    loadCurrentProfile()
  }, [loadCurrentProfile])

  const testDirectInsert = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const testData = {
        id: user.id,
        username: 'test_' + Date.now(),
        full_name: 'Direct Test User',
        user_type: 'kol',
        bio: 'Test bio from direct insert'
      }

      console.log('Testing direct insert with:', testData)

      const { data, error } = await supabase
        .from('profiles')
        .upsert(testData)
        .select()

      console.log('Direct insert result:', { data, error })

      if (error) {
        setError(`Direct insert failed: ${error.message}`)
      } else {
        setError('Direct insert successful! Refreshing data...')
        setTimeout(refreshData, 1000)
      }
    } catch (err) {
      setError(`Direct insert error: ${err}`)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p>Loading profile data...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Database Profile Check</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={refreshData}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
        >
          Refresh Data
        </button>
        
        <button 
          onClick={testDirectInsert}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Direct Insert
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="font-bold text-red-800 mb-2">Error:</h2>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-gray-100 rounded-lg p-6">
        <h2 className="font-bold mb-4">Current Profile Data:</h2>
        {profileData ? (
          <div className="space-y-2">
            <p><strong>ID:</strong> {profileData.id}</p>
            <p><strong>Username:</strong> {profileData.username}</p>
            <p><strong>Full Name:</strong> {profileData.full_name}</p>
            <p><strong>User Type:</strong> {profileData.user_type}</p>
            <p><strong>Bio:</strong> {profileData.bio || 'Not set'}</p>
            <p><strong>Country:</strong> {profileData.country || 'Not set'}</p>
            <p><strong>Languages:</strong> {profileData.languages ? JSON.stringify(profileData.languages) : 'Not set'}</p>
            <p><strong>Industry:</strong> {profileData.industry || 'Not set'}</p>
            <p><strong>Company Size:</strong> {profileData.company_size || 'Not set'}</p>
            <p><strong>Website:</strong> {profileData.website || 'Not set'}</p>
            <p><strong>Followers:</strong> {profileData.followers || 'Not set'}</p>
            <p><strong>Response Time:</strong> {profileData.response_time || 'Not set'}</p>
            <p><strong>Platforms:</strong> {profileData.platforms ? JSON.stringify(profileData.platforms) : 'Not set'}</p>
            <p><strong>Created At:</strong> {profileData.created_at}</p>
            <p><strong>Updated At:</strong> {profileData.updated_at}</p>
          </div>
        ) : (
          <p className="text-gray-600">No profile data found</p>
        )}
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-bold mb-2">Raw Data (JSON):</h3>
        <pre className="text-xs overflow-auto max-h-96 bg-white p-4 rounded border">
          {JSON.stringify(profileData, null, 2)}
        </pre>
      </div>
    </div>
  )
}