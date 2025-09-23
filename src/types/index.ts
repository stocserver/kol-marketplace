export type UserType = 'kol' | 'sponsor'

export interface PlatformStats {
  followers: number
  engagement_rate: number
  [key: string]: unknown
}

export interface GigData {
  id: string
  title: string
  price: number
  image?: string
  rating?: number
  orders?: number
  delivery_days?: number
  [key: string]: unknown
}

export interface ReviewData {
  id: string
  reviewer_name: string
  reviewer_image: string
  rating: number
  comment: string
  [key: string]: unknown
}

export interface FavoriteKOL {
  id: string
  name: string
  username?: string
  image: string
  rating: number
}

export interface RecentOrder {
  id: string
  service_title: string
  amount: number
  status: string
  created_at: string
  kol_name: string
}

export interface Profile {
  id: string
  user_type: UserType
  username: string
  full_name: string
  avatar_url?: string
  created_at: string
  updated_at: string
  platforms: Record<string, PlatformStats>
  bio?: string
  followers?: number
  rating?: number
  total_orders?: number
  member_since?: string
  languages?: string[]
  cover_image?: string
  profile_image?: string
  company_size?: string
  industry?: string
  website?: string
  total_campaigns?: number
  total_spent?: number
  gigs?: GigData[]
  reviews?: ReviewData[]
  recent_work?: unknown[]
  recent_orders?: RecentOrder[]
  favorite_kols?: FavoriteKOL[]
  avg_views_per_content?: number
  [key: string]: unknown
}

export interface Gig {
  id: string
  kol_id: string
  title: string
  description: string
  price: number
  delivery_days: number
  platform?: string
  fast_delivery?: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  kol?: Profile
}

export type OrderStatus = 'pending' | 'paid' | 'in_progress' | 'delivered' | 'completed' | 'cancelled'

export interface Order {
  id: string
  gig_id: string
  sponsor_id: string
  kol_id: string
  status: OrderStatus
  amount: number
  platform_fee: number
  kol_earnings: number
  requirements?: string
  delivery_url?: string
  ecpay_trade_no?: string
  created_at: string
  updated_at: string
  gig?: Gig
  sponsor?: Profile
  kol?: Profile
  submission_count?: number
  last_submission_message?: string
  last_submission_at?: string
  activities?: unknown[]
}