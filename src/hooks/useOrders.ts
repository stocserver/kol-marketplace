import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export interface Order {
  id: string
  gig_id: string
  sponsor_id: string
  kol_id: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'submitted' | 'revision' | 'completed' | 'cancelled' | 'disputed'
  amount: number
  platform_fee: number
  kol_earnings: number
  requirements?: string
  delivery_date?: string
  created_at: string
  updated_at: string
  stripe_payment_intent_id?: string
  
  // Joined data from other tables
  gig: {
    id: string
    title: string
    description: string
    platform: string
    content_type: string
    genre_category: string
    preview_image_url?: string
  }
  sponsor: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
  }
  kol: {
    id: string
    username: string
    full_name: string
    avatar_url?: string
  }
  deliverables?: { name: string; url: string }[]
}

export function useOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('orders')
          .select(`
            *,
            gig:gigs(
              id,
              title,
              description,
              platform,
              content_type,
              genre_category,
              preview_image_url
            ),
            sponsor:profiles!orders_sponsor_id_fkey(
              id,
              username,
              full_name,
              avatar_url
            ),
            kol:profiles!orders_kol_id_fkey(
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .or(`sponsor_id.eq.${user.id},kol_id.eq.${user.id}`)
          .order('created_at', { ascending: false })

        if (fetchError) {
          console.error('Error fetching orders:', fetchError)
          setError('Failed to fetch orders')
          return
        }

        setOrders(data as Order[] || [])
      } catch (err) {
        console.error('Orders fetch error:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user, supabase])

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (error) {
        console.error('Error updating order status:', error)
        return false
      }

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))

      return true
    } catch (error) {
      console.error('Error updating order status:', error)
      return false
    }
  }

  // Filter orders by user role
  const kolOrders = orders.filter(order => order.kol_id === user?.id)
  const sponsorOrders = orders.filter(order => order.sponsor_id === user?.id)
  
  // Get user's orders (both as KOL and as sponsor/buyer)
  const userOrders = orders.filter(order => 
    order.kol_id === user?.id || order.sponsor_id === user?.id
  )

  // Get order statistics - only for current user's orders
  const stats = {
    total: userOrders.length,
    active: userOrders.filter(order => ['pending', 'paid', 'confirmed', 'in_progress', 'submitted', 'delivered'].includes(order.status)).length,
    completed: userOrders.filter(order => order.status === 'completed').length,
    pending: userOrders.filter(order => order.status === 'pending').length,
    totalEarnings: kolOrders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + order.kol_earnings, 0),
    totalSpent: sponsorOrders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + order.amount, 0)
  }

  return {
    orders,
    kolOrders,
    sponsorOrders,
    loading,
    error,
    stats,
    updateOrderStatus
  }
}