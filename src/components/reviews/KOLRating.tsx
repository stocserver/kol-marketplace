'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface KOLRatingProps {
  kolId: string
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface RatingData {
  average: number
  count: number
}

export default function KOLRating({
  kolId,
  showCount = true,
  size = 'md',
  className = ''
}: KOLRatingProps) {
  const [rating, setRating] = useState<RatingData>({ average: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('rating')
          .eq('kol_id', kolId)

        if (error) {
          console.warn('Error fetching rating:', error)
          setRating({ average: 0, count: 0 })
          return
        }

        if (!data || data.length === 0) {
          setRating({ average: 0, count: 0 })
          return
        }

        const ratings = data.map(review => review.rating)
        const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length

        setRating({
          average: Math.round(average * 10) / 10, // Round to 1 decimal
          count: ratings.length
        })

      } catch (error) {
        console.warn('Error calculating rating:', error)
        setRating({ average: 0, count: 0 })
      } finally {
        setLoading(false)
      }
    }

    fetchRating()
  }, [kolId])

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const starSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`${starSizes[size]} text-gray-200 animate-pulse`}>★</div>
          ))}
        </div>
        {showCount && <span className={`${sizeClasses[size]} text-gray-400`}>Loading...</span>}
      </div>
    )
  }

  if (rating.count === 0) {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={`${starSizes[size]} text-gray-300`}>★</span>
          ))}
        </div>
        {showCount && <span className={`${sizeClasses[size]} text-gray-500`}>No reviews</span>}
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`${starSizes[size]} ${
              star <= Math.round(rating.average) ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
      <span className={`${sizeClasses[size]} text-gray-600 font-medium`}>
        {rating.average.toFixed(1)}
      </span>
      {showCount && (
        <span className={`${sizeClasses[size]} text-gray-500`}>
          ({rating.count} review{rating.count !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  )
}

// Export a hook for getting rating data
export function useKOLRating(kolId: string) {
  const [rating, setRating] = useState<RatingData>({ average: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('rating')
          .eq('kol_id', kolId)

        if (error) {
          console.warn('Error fetching rating:', error)
          setRating({ average: 0, count: 0 })
          return
        }

        if (!data || data.length === 0) {
          setRating({ average: 0, count: 0 })
          return
        }

        const ratings = data.map(review => review.rating)
        const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length

        setRating({
          average: Math.round(average * 10) / 10,
          count: ratings.length
        })

      } catch (error) {
        console.warn('Error calculating rating:', error)
        setRating({ average: 0, count: 0 })
      } finally {
        setLoading(false)
      }
    }

    fetchRating()
  }, [kolId])

  return { rating, loading }
}