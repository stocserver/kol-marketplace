'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/contexts/RoleContext'
import KOLProfile from '@/components/profile/KOLProfile'
import SponsorProfile from '@/components/profile/SponsorProfile'

// Mock user data
const mockUsers = {
  'kol1': {
    id: 'kol1',
    type: 'kol',
    username: 'fashionista_emma',
    full_name: 'Emma Rodriguez',
    profile_image: 'https://images.unsplash.com/photo-1494790108755-2616b352caf1?w=300',
    cover_image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200',
    bio: 'Fashion & lifestyle content creator with 125K engaged followers. I specialize in authentic brand partnerships and trendy content that converts. Based in Miami, FL.',
    followers: 125000,
    rating: 4.8,
    total_orders: 47,
    response_time: '2 hours',
    member_since: '2022-03-15',
    languages: ['English', 'Spanish'],
    platforms: {
      'Instagram': { followers: 125000, engagement: '4.2%' },
      'TikTok': { followers: 89000, engagement: '6.8%' },
      'YouTube': { followers: 25000, engagement: '3.1%' }
    },
    gigs: [
      {
        id: '1',
        title: 'Instagram Reel + Story Package - Fashion Content Creation',
        price: 299,
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
        rating: 4.9,
        orders: 12,
        delivery_days: 3
      },
      {
        id: '2', 
        title: 'TikTok Trend Video for Fashion Brands',
        price: 199,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        rating: 4.7,
        orders: 8,
        delivery_days: 2
      },
      {
        id: '3',
        title: 'YouTube Product Review & Unboxing',
        price: 499,
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500',
        rating: 4.8,
        orders: 15,
        delivery_days: 5
      }
    ],
    reviews: [
      {
        id: 1,
        reviewer_name: 'Sarah M.',
        reviewer_image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50',
        rating: 5,
        comment: 'Emma created amazing content for our summer collection launch. The engagement was incredible!',
        date: '2024-08-20',
        order_title: 'Instagram Reel + Story Package'
      },
      {
        id: 2,
        reviewer_name: 'Brand Studio Co.',
        reviewer_image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=50',
        rating: 4,
        comment: 'Professional work and great communication. Will definitely work with Emma again.',
        date: '2024-08-15',
        order_title: 'TikTok Trend Video'
      }
    ],
    recent_work: [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300'
    ]
  },
  'sponsor1': {
    id: 'sponsor1',
    type: 'sponsor',
    username: 'trendy_boutique',
    full_name: 'Trendy Boutique',
    profile_image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300',
    cover_image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
    bio: 'Premium fashion boutique specializing in trendy, affordable clothing for young professionals. We love partnering with authentic creators who share our values.',
    member_since: '2023-01-10',
    company_size: '11-50 employees',
    industry: 'Fashion & Retail',
    website: 'https://trendyboutique.com',
    total_campaigns: 23,
    total_spent: 15420,
    active_orders: 3,
    completed_orders: 20,
    recent_orders: [
      {
        id: 'order_1',
        kol_name: 'Emma Rodriguez',
        kol_image: 'https://images.unsplash.com/photo-1494790108755-2616b352caf1?w=50',
        gig_title: 'Instagram Reel + Story Package',
        amount: 299,
        status: 'in_progress',
        date: '2024-08-22',
        delivery_date: '2024-08-25'
      },
      {
        id: 'order_2',
        kol_name: 'Alex Chen',
        kol_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50',
        gig_title: 'TikTok Product Showcase',
        amount: 199,
        status: 'completed',
        date: '2024-08-18',
        delivery_date: '2024-08-20'
      },
      {
        id: 'order_3',
        kol_name: 'Maria Santos',
        kol_image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50',
        gig_title: 'YouTube Haul Video',
        amount: 449,
        status: 'revision',
        date: '2024-08-15',
        delivery_date: '2024-08-19'
      }
    ],
    favorite_kols: [
      {
        id: 'kol1',
        name: 'Emma Rodriguez',
        username: 'fashionista_emma',
        image: 'https://images.unsplash.com/photo-1494790108755-2616b352caf1?w=100',
        followers: 125000,
        rating: 4.8
      },
      {
        id: 'kol2', 
        name: 'Alex Chen',
        username: 'lifestyle_alex',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        followers: 89000,
        rating: 4.6
      }
    ]
  }
}

export default function ProfilePage() {
  const params = useParams()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { theme } = useRole()

  useEffect(() => {
    // Mock data loading
    const userData = mockUsers[params.id as keyof typeof mockUsers]
    if (userData) {
      setUser(userData)
    }
    setLoading(false)
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Profile not found</h1>
          <p className="text-gray-600 mt-2">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user.type === 'kol' ? (
        <KOLProfile user={user} />
      ) : (
        <SponsorProfile user={user} />
      )}
    </div>
  )
}