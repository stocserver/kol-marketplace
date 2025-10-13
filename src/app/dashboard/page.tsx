'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/contexts/RoleContext'
import KOLDashboard, { KOLUser } from '@/components/dashboard/KOLDashboard'
import SponsorDashboard, { SponsorUser } from '@/components/dashboard/SponsorDashboard'

interface DashboardGigSummary {
  id: string
  title: string
  price: number
  image?: string
  orders: number
  rating: number
  approval_status?: 'pending' | 'approved' | 'rejected'
  is_active?: boolean
  admin_notes?: string | null
}

interface DashboardData {
  orders: Record<string, unknown>[]
  gigs: DashboardGigSummary[]
  rating: number
  total_orders: number
  active_orders: number
  completed_orders: number
  total_earnings: number
  total_spent: number
  monthly_earnings: number
  pending_earnings: number
  recent_transactions: Record<string, unknown>[]
  favorite_kols: Record<string, unknown>[]
  recent_messages: Record<string, unknown>[]
}


export default function DashboardPage() {
  const { currentRole } = useRole()
  const [user, setUser] = useState<KOLUser | SponsorUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true)
        setError('')

        // Get authenticated user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        console.log('Auth user:', authUser)
        console.log('Auth error:', authError)

        if (authError || !authUser) {
          console.log('No authenticated user, redirecting to login')
          router.push('/login')
          return
        }

        // Get user profile from database
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        console.log('✅ Profile loaded:', {
          id: profileData?.id,
          username: profileData?.username,
          user_type: profileData?.user_type,
          full_name: profileData?.full_name
        })
        console.log('Profile error:', profileError)

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // Profile doesn't exist, redirect to profile creation
            console.log('Profile not found, redirecting to profile creation')
            router.push('/profile')
            return
          } else {
            console.error('Database error:', profileError)
            setError('Error loading your profile. Please try again.')
            setLoading(false)
            return
          }
        }

        if (!profileData) {
          console.log('No profile data, redirecting to profile creation')
          router.push('/profile')
          return
        }

        // Fetch dashboard-specific data based on user type
        const dashboardData: DashboardData = {
          orders: [],
          gigs: [],
          rating: 0,
          total_orders: 0,
          active_orders: 0,
          completed_orders: 0,
          total_earnings: 0,  // KOL earnings from completed orders
          total_spent: 0,     // Sponsor spending on orders
          monthly_earnings: 0,
          pending_earnings: 0,
          recent_transactions: [],
          favorite_kols: [],
          recent_messages: []
        }

        // Fetch data based on current UI role, not just stored user_type
        if (currentRole === 'kol') {
          // Fetch KOL dashboard data
          const [ordersResponse, gigsResponse, ratingsResponse, earningsResponse, pendingEarningsResponse, monthlyEarningsResponse] = await Promise.all([
            // Get all orders for this KOL
            supabase
              .from('orders')
              .select(`
                *,
                gig:gigs!inner(*),
                sponsor:profiles!orders_sponsor_id_fkey(username, full_name, avatar_url)
              `)
              .eq('kol_id', profileData.id)
              .order('created_at', { ascending: false }),
            
            // Get KOL's gigs
            supabase
              .from('gigs')
              .select('*')
              .eq('kol_id', profileData.id)
              .order('created_at', { ascending: false }),
            
            // Get average rating
            supabase.rpc('get_user_average_rating', { user_id: profileData.id }),
            
            // Get total earnings
            supabase.rpc('get_kol_total_earnings', { kol_user_id: profileData.id }),
            
            // Get pending earnings
            supabase.rpc('get_kol_pending_earnings', { kol_user_id: profileData.id }),
            
            // Get monthly earnings
            supabase.rpc('get_kol_monthly_earnings', { kol_user_id: profileData.id })
          ])

          // Process orders data
          if (ordersResponse.data) {
            console.log('📊 KOL Orders fetched:', ordersResponse.data.length)
            console.log('📋 Current KOL ID:', profileData.id)
            console.log('📋 Order details:', ordersResponse.data.map(o => ({ 
              id: o.id, 
              status: o.status, 
              kol_id: o.kol_id, 
              sponsor_id: o.sponsor_id,
              gig_title: o.gig?.title 
            })))
            
            dashboardData.orders = ordersResponse.data
            dashboardData.total_orders = ordersResponse.data.length
            
            const activeOrders = ordersResponse.data.filter(order => 
              ['pending', 'paid', 'in_progress', 'delivered'].includes(order.status)
            )
            console.log('🔍 Active orders filter result:', activeOrders.length)
            console.log('🔍 Active orders details:', activeOrders.map(o => ({ id: o.id, status: o.status })))
            
            dashboardData.active_orders = activeOrders.length
            dashboardData.completed_orders = ordersResponse.data.filter(order => 
              order.status === 'completed'
            ).length
            
            // Create recent transactions from completed orders
            dashboardData.recent_transactions = ordersResponse.data
              .filter(order => order.status === 'completed')
              .slice(0, 5)
              .map(order => ({
                description: `${order.gig.title} - ${order.sponsor.full_name}`,
                amount: order.kol_earnings,
                date: order.updated_at,
                status: 'Completed'
              }))
          }

          // Process gigs data
          if (gigsResponse.data) {
            dashboardData.gigs = gigsResponse.data.map(gig => ({
              id: gig.id,
              title: gig.title,
              price: gig.price,
              image: gig.image_urls?.[0] || gig.preview_image_url || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
              orders: dashboardData.orders.filter(order => order.gig_id === gig.id).length,
              rating: 4.8, // TODO: Calculate from actual reviews
              approval_status: gig.approval_status,
              is_active: gig.is_active,
              admin_notes: gig.admin_notes || null
            }))
          }

          // Set rating, earnings (for KOLs)
          dashboardData.rating = ratingsResponse.data || 0
          
          // Debug earnings functions
          console.log('💰 Earnings function results:', {
            total_earnings: earningsResponse.data,
            pending_earnings: pendingEarningsResponse.data,
            monthly_earnings: monthlyEarningsResponse.data
          })
          
          // Calculate earnings directly from orders if functions fail
          const completedOrders = ordersResponse.data?.filter(order => order.status === 'completed') || []
          const calculatedTotalEarnings = completedOrders.reduce((sum, order) => sum + (order.kol_earnings || 0), 0)
          
          console.log('💰 Calculated earnings from orders:', {
            completedOrdersCount: completedOrders.length,
            calculatedTotal: calculatedTotalEarnings
          })
          
          dashboardData.total_earnings = earningsResponse.data || calculatedTotalEarnings
          dashboardData.pending_earnings = pendingEarningsResponse.data || 0
          dashboardData.monthly_earnings = monthlyEarningsResponse.data || 0
          
          // For KOLs, we don't track spending - they earn money
          dashboardData.total_spent = 0
          
        } else if (currentRole === 'sponsor') {
          // Fetch Sponsor dashboard data
          const [ordersResponse] = await Promise.all([
            // Get all orders placed by this sponsor
            supabase
              .from('orders')
              .select(`
                *,
                gig:gigs!inner(*),
                kol:profiles!orders_kol_id_fkey(username, full_name, avatar_url)
              `)
              .eq('sponsor_id', profileData.id)
              .order('created_at', { ascending: false })
          ])

          // Process sponsor orders data
          if (ordersResponse.data) {
            console.log('📊 Sponsor Orders fetched:', ordersResponse.data.length)
            console.log('📋 Current Sponsor ID:', profileData.id)
            console.log('📋 Order details:', ordersResponse.data.map(o => ({ 
              id: o.id, 
              status: o.status, 
              kol_id: o.kol_id, 
              sponsor_id: o.sponsor_id,
              gig_title: o.gig?.title 
            })))
            
            dashboardData.orders = ordersResponse.data
            dashboardData.total_orders = ordersResponse.data.length
            
            const activeOrders = ordersResponse.data.filter(order => 
              ['pending', 'paid', 'in_progress', 'delivered'].includes(order.status)
            )
            const completedOrders = ordersResponse.data.filter(order => 
              order.status === 'completed'
            )
            const paidOrders = ordersResponse.data.filter(order => 
              ['delivered', 'completed'].includes(order.status)
            )
            
            console.log('🔍 Sponsor Order Breakdown:', {
              totalOrders: ordersResponse.data.length,
              activeOrders: activeOrders.length,
              completedOrders: completedOrders.length,
              paidOrdersForSpending: paidOrders.length
            })
            
            dashboardData.active_orders = activeOrders.length
            dashboardData.completed_orders = completedOrders.length
            
            // Calculate total spent by sponsor
            const totalSpent = paidOrders.reduce((sum, order) => sum + (order.amount || 0), 0)
            
            console.log('💸 Sponsor Spending Calculation:', {
              paidOrdersCount: paidOrders.length,
              totalSpent: totalSpent,
              orderAmounts: paidOrders.map(o => ({ id: o.id, amount: o.amount, status: o.status }))
            })
            
            dashboardData.total_spent = totalSpent
            
            // For sponsors, we don't track earnings - they spend money
            dashboardData.total_earnings = 0
            dashboardData.pending_earnings = 0
            dashboardData.monthly_earnings = 0
          }
        }

        // Transform profile data for dashboard components
        const dashboardUser = {
          id: profileData.id,
          username: profileData.username,
          full_name: profileData.full_name,
          email: authUser.email,
          profile_image: profileData.avatar_url || 'https://images.unsplash.com/photo-1494790108755-2616b352caf1?w=150',
          cover_image: profileData.cover_image || 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
          bio: profileData.bio || 'No bio provided yet.',
          user_type: profileData.user_type,
          member_since: profileData.created_at,
          
          // KOL specific fields
          followers: profileData.followers || 0,
          response_time: profileData.response_time || '2 hours',
          platforms: profileData.platforms || {},
          languages: profileData.languages || [],
          
          // Sponsor specific fields
          company_size: profileData.company_size,
          industry: profileData.industry,
          website: profileData.website,

          // Real dashboard data
          ...dashboardData
        }

        setUser(dashboardUser)

      } catch (err) {
        console.error('Dashboard error:', err)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [router, supabase, currentRole])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Dashboard Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-x-3">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try Again
              </button>
              <button 
                onClick={() => router.push('/profile')} 
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Setup Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Setup Required</h2>
          <p className="text-gray-600 mb-4">Please complete your profile to access the dashboard</p>
          <button 
            onClick={() => router.push('/profile')} 
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Setup Profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentRole === 'kol' ? (
        <KOLDashboard user={user} />
      ) : (
        <SponsorDashboard user={user} />
      )}
    </div>
  )
}
