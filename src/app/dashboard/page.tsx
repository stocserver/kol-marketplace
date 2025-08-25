'use client'

import { useEffect, useState } from 'react'
import { useRole } from '@/contexts/RoleContext'
import KOLDashboard from '@/components/dashboard/KOLDashboard'
import SponsorDashboard from '@/components/dashboard/SponsorDashboard'

// Mock user data for KOL
const mockKOLUser = {
  id: 'kol1',
  username: 'fashionista_emma',
  full_name: 'Emma Rodriguez',
  profile_image: 'https://images.unsplash.com/photo-1494790108755-2616b352caf1?w=150',
  cover_image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
  bio: 'Fashion & lifestyle content creator with 2M+ followers. Specializing in brand partnerships and authentic storytelling.',
  rating: 4.9,
  total_orders: 156,
  active_orders: 8,
  completed_orders: 148,
  total_earnings: 47500,
  monthly_earnings: 12300,
  pending_earnings: 3400,
  recent_transactions: [
    { description: 'Instagram Reel Package - TechCorp', amount: 450, date: '2024-01-15', status: 'Completed' },
    { description: 'YouTube Sponsorship - BeautyBrand', amount: 890, date: '2024-01-12', status: 'Completed' },
    { description: 'TikTok Campaign - FashionHouse', amount: 320, date: '2024-01-10', status: 'Pending' }
  ],
  orders: [
    {
      id: 'ORD-001',
      sponsor_name: 'Sarah Chen',
      sponsor_image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      gig_title: 'Instagram Reel + Story Package - Fashion Content Creation',
      amount: 299,
      status: 'confirmed',
      delivery_date: '2024-01-20',
      requirements: 'Create 1 Instagram Reel (30-60s) showcasing our new winter collection. Include 2 Instagram Stories with swipe-up links. Use hashtags #WinterVibes #FashionGoals. Brand colors should be prominently featured.'
    },
    {
      id: 'ORD-002',
      sponsor_name: 'Mike Johnson',
      sponsor_image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      gig_title: 'TikTok Viral Video - Tech Product Review',
      amount: 450,
      status: 'in_progress',
      delivery_date: '2024-01-18',
      requirements: 'Create an engaging TikTok video reviewing our new smartwatch. Focus on fitness features and daily usability. Video should be 60 seconds max with trending audio.'
    },
    {
      id: 'ORD-003',
      sponsor_name: 'Lisa Park',
      sponsor_image: 'https://images.unsplash.com/photo-1494790108755-2616b352caf1?w=150',
      gig_title: 'YouTube Sponsored Content',
      amount: 890,
      status: 'revision',
      delivery_date: '2024-01-16',
      requirements: 'Need to adjust the product placement timing as discussed. The logo should appear more prominently in the first 15 seconds.'
    },
    {
      id: 'ORD-004',
      sponsor_name: 'David Wilson',
      sponsor_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      gig_title: 'Brand Ambassador Post',
      amount: 320,
      status: 'submitted',
      delivery_date: '2024-01-22',
      requirements: 'Perfect! The content captures our brand essence beautifully. Please confirm the posting schedule.'
    }
  ],
  gigs: [
    {
      id: '1',
      title: 'Instagram Reel + Story Package',
      price: 299,
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
      orders: 45,
      rating: 4.9
    },
    {
      id: '2',
      title: 'TikTok Viral Video Creation',
      price: 450,
      image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
      orders: 32,
      rating: 4.8
    },
    {
      id: '3',
      title: 'YouTube Sponsored Content',
      price: 890,
      image: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400',
      orders: 18,
      rating: 5.0
    }
  ],
  recent_messages: [
    {
      id: 'msg1',
      sender_name: 'Sarah Chen',
      sender_image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      preview: 'Hi Emma! I love the draft you sent. Could we adjust the timing on the product showcase?',
      timestamp: '2024-01-15T14:30:00Z',
      order_id: 'ORD-001'
    },
    {
      id: 'msg2', 
      sender_name: 'Mike Johnson',
      sender_image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      preview: 'The TikTok video looks amazing! Ready to review whenever you are.',
      timestamp: '2024-01-15T10:15:00Z',
      order_id: 'ORD-002'
    }
  ]
}

// Mock user data for Sponsor
const mockSponsorUser = {
  id: 'sponsor1',
  username: 'tech_innovator_sarah',
  full_name: 'Sarah Chen',
  company_size: '50-200 employees',
  industry: 'Technology',
  profile_image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
  cover_image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800',
  bio: 'Marketing Director at TechCorp. Passionate about connecting innovative products with the right audience through authentic influencer partnerships.',
  member_since: '2023-03-15',
  website: 'https://techcorp.com',
  total_campaigns: 15,
  total_spent: 25400,
  active_orders: 6,
  completed_orders: 28,
  analytics: {
    total_reach: 2500000,
    avg_engagement: 4.2,
    roi: 3.5,
    cpm: 12,
    top_kols: [
      { name: 'Emma Rodriguez', platform: 'Instagram', engagement: '4.8%', reach: 850000, image: 'https://images.unsplash.com/photo-1494790108755-2616b352caf1?w=150' },
      { name: 'Alex Chen', platform: 'TikTok', engagement: '6.2%', reach: 420000, image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
      { name: 'Sofia Martinez', platform: 'YouTube', engagement: '3.9%', reach: 650000, image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' }
    ]
  },
  orders: [
    {
      id: 'ORD-001',
      kol_name: 'Emma Rodriguez',
      kol_image: 'https://images.unsplash.com/photo-1494790108755-2616b352caf1?w=150',
      gig_title: 'Instagram Reel + Story Package - Fashion Content Creation',
      amount: 299,
      status: 'confirmed',
      delivery_date: '2024-01-20',
      deliverables: [
        { name: 'reel_draft_v1.mp4', type: 'video' },
        { name: 'story_content.jpg', type: 'image' }
      ]
    },
    {
      id: 'ORD-005',
      kol_name: 'Alex Chen',
      kol_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      gig_title: 'TikTok Product Review',
      amount: 450,
      status: 'submitted',
      delivery_date: '2024-01-18',
      deliverables: [
        { name: 'tiktok_final.mp4', type: 'video' },
        { name: 'caption_copy.txt', type: 'text' },
        { name: 'hashtag_research.pdf', type: 'document' }
      ]
    },
    {
      id: 'ORD-006',
      kol_name: 'Sofia Martinez',
      kol_image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      gig_title: 'YouTube Product Demo',
      amount: 890,
      status: 'in_progress',
      delivery_date: '2024-01-25',
      deliverables: null
    }
  ],
  campaigns: [
    {
      id: 'CAM-001',
      name: 'Winter Product Launch',
      status: 'active',
      budget: 15000,
      spent: 8400,
      kol_count: 8,
      total_reach: 1200000
    },
    {
      id: 'CAM-002',
      name: 'Brand Awareness Q1',
      status: 'completed',
      budget: 12000,
      spent: 11800,
      kol_count: 6,
      total_reach: 950000
    },
    {
      id: 'CAM-003',
      name: 'Spring Collection Teaser',
      status: 'planning',
      budget: 20000,
      spent: 0,
      kol_count: 0,
      total_reach: 0
    }
  ],
  favorite_kols: [
    {
      id: 'kol1',
      name: 'Emma Rodriguez',
      username: 'fashionista_emma',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b352caf1?w=150',
      followers: 2100000,
      rating: 4.9,
      starting_price: 299,
      completed_orders: 148
    },
    {
      id: 'kol2',
      name: 'Alex Chen',
      username: 'tech_alex',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      followers: 850000,
      rating: 4.7,
      starting_price: 420,
      completed_orders: 89
    },
    {
      id: 'kol3',
      name: 'Sofia Martinez',
      username: 'lifestyle_sofia',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      followers: 1300000,
      rating: 4.8,
      starting_price: 650,
      completed_orders: 76
    }
  ]
}

export default function DashboardPage() {
  const { role, theme } = useRole()
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Set mock user data based on role
    if (role === 'kol') {
      setUser(mockKOLUser)
    } else if (role === 'sponsor') {
      setUser(mockSponsorUser)
    }
  }, [role])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {role === 'kol' ? (
        <KOLDashboard user={user} />
      ) : (
        <SponsorDashboard user={user} />
      )}
    </div>
  )
}