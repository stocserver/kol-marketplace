export type UserType = 'kol' | 'sponsor'

export interface Profile {
  id: string
  user_type: UserType
  username: string
  full_name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Gig {
  id: string
  kol_id: string
  title: string
  description: string
  price: number
  delivery_days: number
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
}