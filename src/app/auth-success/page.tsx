'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
// import { createClient } from '@/lib/supabase/client'
import { triggerAuthRefresh } from '@/hooks/useAuth'

export default function AuthSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    async function handleAuthSuccess() {
      console.log('Auth Success: Attempting to get user info from URL or cookies')
      
      try {
        // Check URL params for auth data (from OAuth callback)
        const urlParams = new URLSearchParams(window.location.search)
        const accessToken = urlParams.get('access_token')
        const refreshToken = urlParams.get('refresh_token')
        
        if (accessToken) {
          console.log('Auth Success: Found access token in URL')
          
          // Store tokens in localStorage manually
          const authData = {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: { id: 'temp' }, // Will get real user info from API
            expires_at: Date.now() + (3600 * 1000) // 1 hour from now
          }
          
          localStorage.setItem('supabase.auth.token', JSON.stringify(authData))
          console.log('Auth Success: Stored auth data in localStorage')
        }
        
        // Try to get user info from access token
        let userInfo = null
        const storedAuth = localStorage.getItem('supabase.auth.token')
        
        if (storedAuth) {
          try {
            const authData = JSON.parse(storedAuth)
            
            // Get user info from Supabase auth API
            const userResponse = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,
              {
                headers: {
                  'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                  'Authorization': `Bearer ${authData.access_token}`,
                  'Content-Type': 'application/json'
                }
              }
            )
            
            if (userResponse.ok) {
              userInfo = await userResponse.json()
              console.log('Auth Success: Got user info:', userInfo.id)
              
              // Update localStorage with real user info
              authData.user = userInfo
              localStorage.setItem('supabase.auth.token', JSON.stringify(authData))
            }
          } catch (e) {
            console.warn('Auth Success: Failed to get user info:', e)
          }
        }
        
        // If we have a user, check their profile
        if (userInfo?.id) {
          console.log('Auth Success: Checking profile for user:', userInfo.id)
          
          const profileResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userInfo.id}&select=*`,
            {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Content-Type': 'application/json'
              }
            }
          )
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json()
            console.log('Auth Success: Profile check result:', profileData.length > 0)
            
            if (profileData.length > 0) {
              // Trigger auth refresh to update header
              triggerAuthRefresh()
              router.push('/dashboard')
            } else {
              router.push('/signup-complete')
            }
            return
          }
        }
        
        // Fallback: just redirect to dashboard
        console.log('Auth Success: Fallback redirect to dashboard')
        router.push('/dashboard')
        
      } catch (error) {
        console.error('Auth Success: Error:', error)
        router.push('/login')
      }
    }
    
    setTimeout(handleAuthSuccess, 1000)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">正在完成登入...</p>
      </div>
    </div>
  )
}