import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export interface Favorite {
  id: string
  user_id: string
  gig_id: string
  created_at: string
}

export function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<string[]>([]) // Array of gig IDs
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Fetch user's favorites on mount
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setFavorites([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('favorites')
          .select('gig_id')
          .eq('user_id', user.id)

        if (fetchError) {
          console.error('Error fetching favorites:', fetchError)
          // Check if it's a missing table error
          if (fetchError.code === 'PGRST116' || fetchError.message?.includes('relation "public.favorites" does not exist')) {
            console.log('Favorites table does not exist yet. This is normal if migrations haven\'t been run.')
            setFavorites([])
            setLoading(false)
            return
          }
          setError('Failed to load favorites')
          return
        }

        const favoriteGigIds = data?.map(fav => fav.gig_id) || []
        setFavorites(favoriteGigIds)
      } catch (err) {
        console.error('Favorites fetch error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [user, supabase])

  const toggleFavorite = async (gigId: string): Promise<boolean> => {
    if (!user) {
      setError('You must be logged in to favorite gigs')
      return false
    }

    try {
      const isFavorited = favorites.includes(gigId)

      if (isFavorited) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('gig_id', gigId)

        if (error) {
          console.error('Error removing favorite:', error)
          setError('Failed to remove favorite')
          return false
        }

        // Update local state
        setFavorites(prev => prev.filter(id => id !== gigId))
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            gig_id: gigId
          })

        if (error) {
          console.error('Error adding favorite:', error)
          setError('Failed to add favorite')
          return false
        }

        // Update local state
        setFavorites(prev => [...prev, gigId])
      }

      return true
    } catch (error) {
      console.error('Error toggling favorite:', error)
      setError('An unexpected error occurred')
      return false
    }
  }

  const isFavorited = (gigId: string): boolean => {
    return favorites.includes(gigId)
  }

  const getFavoriteCount = async (gigId: string): Promise<number> => {
    const { count } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('gig_id', gigId)
    return count || 0
  }

  const getFavoriteGigs = async () => {
    if (!user || favorites.length === 0) return []

    const { data, error } = await supabase
      .from('gigs')
      .select(`
        *,
        kol:profiles!gigs_kol_id_fkey(
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .in('id', favorites)
      .eq('is_active', true)
      .eq('approval_status', 'approved')

    if (error) {
      console.error('Error fetching favorite gigs:', error)
      return []
    }

    return data || []
  }

  return {
    favorites,
    loading,
    error,
    toggleFavorite,
    isFavorited,
    getFavoriteCount,
    getFavoriteGigs,
    favoriteCount: favorites.length
  }
}