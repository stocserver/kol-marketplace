'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface OrderReviewProps {
  orderId: string
  kolId: string
  kolName: string
  sponsorId: string
  orderCompletedAt: string
  currentUserId: string
  userType: 'sponsor' | 'kol' | 'admin'
  existingReview?: {
    id: string
    rating: number
    comment: string
    kol_response?: string
    kol_response_at?: string
    created_at: string
  }
}

export default function OrderReview({
  orderId,
  kolId,
  kolName,
  sponsorId,
  orderCompletedAt,
  currentUserId,
  userType,
  existingReview
}: OrderReviewProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [kolResponse, setKolResponse] = useState('')
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const supabase = createClient()

  // Check if review period has expired (48 hours after completion)
  const reviewDeadline = new Date(orderCompletedAt)
  reviewDeadline.setHours(reviewDeadline.getHours() + 48)
  const isReviewPeriodExpired = new Date() > reviewDeadline
  const isReviewOwner = userType === 'sponsor' && currentUserId === sponsorId
  const isKolResponder = userType === 'kol' && currentUserId === kolId

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert('Please select a rating')
      return
    }

    setIsSubmitting(true)
    try {
      const reviewData = {
        order_id: orderId,
        kol_id: kolId,
        sponsor_id: sponsorId,
        rating: rating,
        comment: comment.trim() || null
      }

      // Only create new reviews - no updates allowed
      const { error } = await supabase
        .from('reviews')
        .insert(reviewData)

      if (error) {
        console.error('Error submitting review:', error)
        if (error.message?.includes('review_time_limit')) {
          alert('Review period has expired. Reviews must be submitted within 48 hours of order completion.')
        } else {
          alert('Failed to submit review. Please try again.')
        }
        return
      }

      setIsSubmitted(true)
      console.log('✅ Review submitted successfully')

    } catch (error) {
      console.error('Review submission error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKolResponse = async () => {
    if (!kolResponse.trim()) {
      alert('Please enter a response')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          kol_response: kolResponse.trim(),
          kol_response_at: new Date().toISOString()
        })
        .eq('id', existingReview!.id)

      if (error) {
        console.error('Error submitting response:', error)
        alert('Failed to submit response. Please try again.')
        return
      }

      console.log('✅ KOL response submitted successfully')
      window.location.reload() // Refresh to show updated response

    } catch (error) {
      console.error('KOL response error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const StarIcon = ({ filled, hovered, onClick, onMouseEnter, onMouseLeave, disabled }: {
    filled: boolean
    hovered: boolean
    onClick: () => void
    onMouseEnter: () => void
    onMouseLeave: () => void
    disabled?: boolean
  }) => (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`text-2xl transition-colors ${
        filled || hovered ? 'text-yellow-400' : 'text-gray-300'
      } hover:text-yellow-400 focus:outline-none ${disabled ? 'cursor-not-allowed' : ''}`}
      disabled={disabled}
    >
      ★
    </button>
  )

  // Show existing review (read-only)
  if (existingReview) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Review</h3>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded border">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Rating:</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`text-lg ${star <= existingReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm text-gray-600">({existingReview.rating}/5)</span>
            </div>
            {existingReview.comment && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Comment:</span> &quot;{existingReview.comment}&quot;
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              Reviewed on {new Date(existingReview.created_at).toLocaleDateString()}
            </div>
          </div>

          {/* KOL Response Section */}
          {existingReview.kol_response ? (
            <div className="p-4 bg-blue-50 rounded border">
              <div className="text-sm font-medium text-gray-700 mb-2">KOL Response:</div>
              <div className="text-sm text-gray-600 mb-2">&quot;{existingReview.kol_response}&quot;</div>
              <div className="text-xs text-gray-500">
                Responded on {new Date(existingReview.kol_response_at!).toLocaleDateString()}
              </div>
            </div>
          ) : isKolResponder ? (
            <div className="p-4 bg-blue-50 rounded border">
              <div className="text-sm font-medium text-gray-700 mb-2">Your Response:</div>
              <textarea
                value={kolResponse}
                onChange={(e) => setKolResponse(e.target.value)}
                placeholder="Respond to this review..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">{kolResponse.length}/500 characters</p>
                <button
                  onClick={handleKolResponse}
                  disabled={isSubmitting || !kolResponse.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-medium"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Response'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  // Show success message after submitting new review
  if (isSubmitted) {
    return (
      <div className="bg-green-50 rounded-lg p-6 border border-green-200">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">Review Submitted</h3>
            <p className="text-sm text-green-700">
              Thank you for your feedback! Your review helps other sponsors find great KOLs.
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-white rounded border">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Your Rating:</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                  ★
                </span>
              ))}
            </div>
          </div>
          {comment && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Comment:</span> &quot;{comment}&quot;
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Show time limit warning */}
      {!isReviewOwner ? (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600">Only the sponsor can leave a review for this order.</p>
        </div>
      ) : isReviewPeriodExpired ? (
        <div className="bg-red-50 rounded-lg p-4 mb-4 border border-red-200">
          <p className="text-sm text-red-700">Review period has expired. Reviews must be submitted within 48 hours of order completion.</p>
          <p className="text-xs text-red-600 mt-1">Deadline was: {reviewDeadline.toLocaleString()}</p>
        </div>
      ) : (
        <div className="bg-yellow-50 rounded-lg p-4 mb-4 border border-yellow-200">
          <p className="text-sm text-yellow-700">You have until {reviewDeadline.toLocaleString()} to submit your review.</p>
        </div>
      )}

      {!isReviewOwner || isReviewPeriodExpired ? null : (
        <>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Rate Your Experience</h3>
            <p className="text-sm text-gray-600">
              How was your experience working with {kolName}?
            </p>
          </div>

          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Rating (1-5 stars) *
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  filled={star <= rating}
                  hovered={star <= hoveredRating}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                />
              ))}
              <span className="ml-3 text-sm text-gray-600">
                {rating > 0 && (
                  <>
                    {rating} star{rating !== 1 ? 's' : ''} - {
                      rating === 1 ? 'Poor' :
                      rating === 2 ? 'Fair' :
                      rating === 3 ? 'Good' :
                      rating === 4 ? 'Very Good' :
                      'Excellent'
                    }
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">
              Comment (optional)
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience working with this KOL..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitReview}
            disabled={isSubmitting || rating === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>

          {rating === 0 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Please select a rating to submit your review
            </p>
          )}
        </>
      )}
    </div>
  )
}