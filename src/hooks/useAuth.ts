import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

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

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function loadAuth() {
      try {
        // Use proper Supabase auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          setAuthState({ user: null, profile: null, loading: false })
          return
        }

        // Load profile using Supabase client
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        const profile = (!profileError && profileData) ? profileData : null

        setAuthState({
          user: { id: user.id, email: user.email },
          profile,
          loading: false
        })

      } catch (error) {
        console.error('useAuth: Error loading auth:', error)
        setAuthState({ user: null, profile: null, loading: false })
      }
    }

    loadAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event)
      loadAuth()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return authState
}

