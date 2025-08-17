import { useState, useEffect } from 'react'

interface User {
  id: string
  email?: string
}

interface Profile {
  id: string
  username: string
  full_name: string
  user_type: 'kol' | 'sponsor'
  avatar_url?: string
}

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true
  })

  useEffect(() => {
    async function loadAuth() {
      try {
        // Check localStorage for auth data
        const authKeys = Object.keys(localStorage).filter(key => 
          key.includes('supabase.auth.token')
        )
        
        if (authKeys.length === 0) {
          setAuthState({ user: null, profile: null, loading: false })
          return
        }

        // Get user data from localStorage
        let userId = null
        let userData = null

        for (const key of authKeys) {
          try {
            const authData = localStorage.getItem(key)
            if (authData) {
              const parsed = JSON.parse(authData)
              if (parsed.user?.id) {
                userId = parsed.user.id
                userData = parsed.user
                break
              }
            }
          } catch {
            console.warn('useAuth: Failed to parse auth data for key:', key)
          }
        }

        if (!userId) {
          setAuthState({ user: null, profile: null, loading: false })
          return
        }

        // Load profile using direct REST API call
        const profileResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Content-Type': 'application/json'
            }
          }
        )

        let profile = null
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          if (profileData.length > 0) {
            profile = profileData[0]
          }
        }

        setAuthState({
          user: userData,
          profile,
          loading: false
        })

      } catch (error) {
        console.error('useAuth: Error loading auth:', error)
        setAuthState({ user: null, profile: null, loading: false })
      }
    }

    loadAuth()

    // Listen for storage changes (when user logs in/out)
    const handleStorageChange = () => {
      loadAuth()
    }

    // Listen for custom auth events
    const handleAuthChange = () => {
      loadAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('auth-change', handleAuthChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-change', handleAuthChange)
    }
  }, [])

  return authState
}

// Helper function to trigger auth refresh
export function triggerAuthRefresh() {
  window.dispatchEvent(new Event('auth-change'))
}