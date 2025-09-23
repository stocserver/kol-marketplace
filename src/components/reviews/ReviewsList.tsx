'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface Review {
  id: string
  rating: number
  comment: string
  kol_response?: string
  kol_response_at?: string
  created_at: string
  sponsor: {
    username: string
    full_name?: string
    avatar_url?: string
  }
  order: {
    id: string
    gig: {
      title: string
    }
  }
}

interface ReviewsListProps {
  kolId: string
  showGigTitle?: boolean
  limit?: number
  showLoadMore?: boolean
}

export default function ReviewsList({
  kolId,
  showGigTitle = false,
  limit,
  showLoadMore = true
}: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [currentLimit, setCurrentLimit] = useState(limit || 10)
  const supabase = createClient()

  const loadReviews = useCallback(async (pageLimit?: number) => {
    try {
      setLoading(true)
      const query = supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          kol_response,
          kol_response_at,
          created_at,
          sponsor:profiles!reviews_sponsor_id_fkey(
            username,
            full_name,
            avatar_url
          ),
          order:orders!reviews_order_id_fkey(
            id,
            gig:gigs(title)
          )
        `)
        .eq('kol_id', kolId)
        .order('created_at', { ascending: false })

      if (pageLimit) {
        query.limit(pageLimit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading reviews:', error)
        return
      }

      setReviews((data as unknown as Review[]) || [])

      // Check if there are more reviews
      if (pageLimit) {
        const { count } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('kol_id', kolId)

        setHasMore((count || 0) > pageLimit)
      }

    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }, [kolId, supabase])

  useEffect(() => {
    loadReviews(currentLimit)
  }, [kolId, currentLimit, loadReviews])

  const loadMore = () => {
    const newLimit = currentLimit + 10
    setCurrentLimit(newLimit)
    loadReviews(newLimit)
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : '0.0'

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-500">No reviews yet</p>
          <p className="text-sm text-gray-400 mt-1">Be the first to work with this KOL and leave a review!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Reviews ({reviews.length})
        </h3>
        <div className="flex items-center space-x-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-lg ${
                  star <= Math.round(parseFloat(averageRating))
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className="text-sm font-medium text-gray-700">{averageRating}</span>
        </div>
      </div>

      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-gray-100 last:border-b-0 pb-6 last:pb-0">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {review.sponsor.avatar_url ? (
                  <Image
                    src={review.sponsor.avatar_url}
                    alt={review.sponsor.full_name || review.sponsor.username}
                    className="w-10 h-10 rounded-full object-cover"
                    width={40}
                    height={40}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {(review.sponsor.full_name || review.sponsor.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {review.sponsor.full_name || review.sponsor.username}
                    </p>
                    {showGigTitle && (
                      <p className="text-xs text-gray-500">
                        for &quot;{review.order.gig.title}&quot;
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${
                            star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {review.comment && (
                  <p className="text-sm text-gray-700 mb-3">{review.comment}</p>
                )}

                {review.kol_response && (
                  <div className="bg-blue-50 rounded-lg p-3 mt-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-blue-700">KOL Response</span>
                      <span className="text-xs text-blue-600">
                        {new Date(review.kol_response_at!).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-blue-800">{review.kol_response}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showLoadMore && hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Load More Reviews
          </button>
        </div>
      )}
    </div>
  )
}