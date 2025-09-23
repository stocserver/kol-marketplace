'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface PlatformStats {
  followers: number
  engagement_rate: number
  [key: string]: unknown
}

interface GigData {
  id: string
  title: string
  price: number
  image_url?: string
  [key: string]: unknown
}

interface ReviewData {
  id: string
  reviewer_name: string
  reviewer_image: string
  rating: number
  comment: string
  [key: string]: unknown
}

interface KOLUser {
  id: string
  platforms: Record<string, PlatformStats>
  gigs?: GigData[]
  reviews?: ReviewData[]
  cover_image?: string
  avatar_url?: string
  [key: string]: unknown
}

interface KOLProfileProps {
  user: KOLUser
}

export default function KOLProfile({ user }: KOLProfileProps) {
  const [activeTab, setActiveTab] = useState('gigs')
  const { user: currentUser } = useAuth()
  const router = useRouter()

  const handleMessage = () => {
    if (!currentUser) {
      router.push('/login')
      return
    }
    router.push(`/messages?recipient=${user.id}`)
  }

  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`
    }
    return count.toString()
  }

  return (
    <div>
      {/* Cover Photo & Profile Header */}
      <div className="relative">
        <div className="h-64 bg-gradient-to-r from-blue-500 to-purple-600 overflow-hidden">
          <Image
            src={user.cover_image || '/images/default-cover.jpg'}
            alt="Cover"
            width={800}
            height={256}
            className="w-full h-full object-cover opacity-80"
            style={{objectFit: 'cover'}}
          />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end space-x-6 pb-6">
              <div className="relative">
                <Image
                  src={user.profile_image || '/images/default-avatar.jpg'}
                  alt={user.full_name || 'Profile'}
                  width={128}
                  height={128}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                  style={{objectFit: 'cover'}}
                />
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              
              <div className="flex-1 text-white">
                <h1 className="text-3xl font-bold">{user.full_name}</h1>
                <p className="text-xl opacity-90">@{user.username}</p>
                <div className="flex items-center space-x-6 mt-2">
                  <div className="flex items-center space-x-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-semibold">{user.rating}</span>
                    <span className="opacity-80">({user.total_orders} reviews)</span>
                  </div>
                  <div>{formatFollowers(user.followers)} followers</div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={handleMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.471L3 21l2.471-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                  </svg>
                  <span>Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* About */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
              <p className="text-gray-700 leading-relaxed mb-4">{user.bio}</p>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>Member since {new Date(user.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
                
                
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-3.22l-2.4 1.8a1 1 0 01-1.2 0L5.22 15H5a2 2 0 01-2-2V5zm5.808 7.586l-.808.606-.808-.606L7 12.414V10a1 1 0 112 0v2.414l-.192.172z" clipRule="evenodd" />
                  </svg>
                  <span>Languages: {user.languages.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Platform Stats */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Stats</h3>
              <div className="space-y-4">
                {Object.entries(user.platforms).map(([platform, stats]: [string, PlatformStats]) => (
                  <div key={platform} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{platform}</div>
                      <div className="text-sm text-gray-600">{formatFollowers(stats.followers)} followers</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">{stats.engagement}</div>
                      <div className="text-xs text-gray-500">engagement</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Work Portfolio */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Work</h3>
              {user.recent_work && user.recent_work.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {user.recent_work.map((image: string, index: number) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                      <Image
                        src={image}
                        alt={`Work ${index + 1}`}
                        width={120}
                        height={120}
                        className="w-full h-full object-cover"
                        style={{objectFit: 'cover'}}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">No work samples yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Tabs Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {['gigs', 'reviews'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>
              
              <div className="p-6">
                {activeTab === 'gigs' && (
                  <div>
                    {user.gigs && user.gigs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {user.gigs.map((gig: GigData) => (
                      <Link key={gig.id} href={`/gigs/${gig.id}`}>
                        <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                          <div className="aspect-video bg-gray-200">
                            <Image
                              src={gig.image || '/images/default-gig.jpg'}
                              alt={gig.title}
                              width={400}
                              height={225}
                              className="w-full h-full object-cover"
                              style={{objectFit: 'cover'}}
                            />
                          </div>
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{gig.title}</h4>
                            <div className="flex items-center justify-between">
                              <div className="text-lg font-bold text-blue-600">${gig.price}</div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span>{gig.rating}</span>
                                  <span>({gig.orders})</span>
                                </div>
                                <span>{gig.delivery_days} days</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8l-8 8-4-4" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Gigs Yet</h3>
                        <p className="text-gray-500 mb-4">This KOL hasn&apos;t created any gigs yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    {user.reviews && user.reviews.length > 0 ? (
                      user.reviews.map((review: ReviewData) => (
                        <div key={review.id} className="border-b border-gray-200 pb-6">
                          <div className="flex items-start space-x-4">
                            <Image
                              src={review.reviewer_image || '/images/default-avatar.jpg'}
                              alt={review.reviewer_name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-full object-cover"
                              style={{objectFit: 'cover'}}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900">{review.reviewer_name}</h4>
                                <span className="text-sm text-gray-500">
                                  {new Date(review.date).toLocaleDateString()}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="flex space-x-1">
                                  {[...Array(5)].map((_, i) => (
                                    <svg
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                      }`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600">for &quot;{review.order_title}&quot;</span>
                              </div>
                              
                              <p className="text-gray-700">{review.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.13 8.13 0 01-3.27-.66L9 20l-.91-2.1A8 8 0 113 12z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                        <p className="text-gray-500 mb-4">This KOL hasn&apos;t received any reviews yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}