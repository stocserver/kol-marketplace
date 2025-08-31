'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AdminStats {
  totalGigs: number
  pendingGigs: number
  totalUsers: number
  totalOrders: number
  pendingPayouts: number
  totalPayouts: number
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Simple admin check - in production, you'd want proper role-based access control
  const isAdmin = user?.email === 'admin@kolmarketplace.com' || 
                  user?.email?.endsWith('@admin.com') || 
                  user?.email === 'ivn.c.yu@gmail.com'

  useEffect(() => {
    if (!user) return
    if (!isAdmin) {
      router.push('/dashboard')
      return
    }
    fetchStats()
  }, [user, isAdmin, supabase, router])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Fetch stats in parallel
      const [gigsResult, usersResult, ordersResult, payoutsResult] = await Promise.all([
        supabase.from('gigs').select('approval_status'),
        supabase.from('profiles').select('id'),
        supabase.from('orders').select('id'),
        supabase.from('payout_requests').select('status')
      ])

      const gigs = gigsResult.data || []
      const pendingGigs = gigs.filter(g => g.approval_status === 'pending').length
      
      const payouts = payoutsResult.data || []
      const pendingPayouts = payouts.filter(p => p.status === 'pending').length

      setStats({
        totalGigs: gigs.length,
        pendingGigs,
        totalUsers: usersResult.data?.length || 0,
        totalOrders: ordersResult.data?.length || 0,
        pendingPayouts,
        totalPayouts: payouts.length
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage the KOL Marketplace platform</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Gigs</h3>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalGigs || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Gigs</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats?.pendingGigs || 0}</p>
            {stats?.pendingGigs > 0 && (
              <p className="text-sm text-yellow-600 mt-1">Requires attention</p>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-blue-600">{stats?.totalUsers || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Orders</h3>
            <p className="text-3xl font-bold text-green-600">{stats?.totalOrders || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Payouts</h3>
            <p className="text-3xl font-bold text-orange-600">{stats?.pendingPayouts || 0}</p>
            {stats?.pendingPayouts > 0 && (
              <p className="text-sm text-orange-600 mt-1">Requires approval</p>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Payouts</h3>
            <p className="text-3xl font-bold text-purple-600">{stats?.totalPayouts || 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/gigs"
              className="p-6 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Review Gigs</h3>
                  <p className="text-sm text-gray-600">Approve or reject service offerings</p>
                  {stats?.pendingGigs > 0 && (
                    <p className="text-xs text-yellow-600 mt-1">{stats.pendingGigs} pending</p>
                  )}
                </div>
              </div>
            </Link>

            <Link
              href="/admin/payouts"
              className="p-6 border border-gray-200 rounded-lg hover:border-orange-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Manage Payouts</h3>
                  <p className="text-sm text-gray-600">Approve KOL payout requests</p>
                  {stats?.pendingPayouts > 0 && (
                    <p className="text-xs text-orange-600 mt-1">{stats.pendingPayouts} pending</p>
                  )}
                </div>
              </div>
            </Link>

            <div className="p-6 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Manage Users</h3>
                  <p className="text-sm text-gray-500">Coming soon</p>
                </div>
              </div>
            </div>

            <div className="p-6 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Analytics</h3>
                  <p className="text-sm text-gray-500">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="font-medium text-blue-900">Gig Management</h3>
                <p className="text-sm text-blue-700">Review and approve new service offerings from KOLs</p>
              </div>
              <Link
                href="/admin/gigs"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Manage
              </Link>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-700">User Management</h3>
                <p className="text-sm text-gray-600">Manage KOLs and Sponsors (Coming Soon)</p>
              </div>
              <button
                disabled
                className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm font-medium"
              >
                Coming Soon
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-700">Platform Analytics</h3>
                <p className="text-sm text-gray-600">View detailed platform metrics and reports (Coming Soon)</p>
              </div>
              <button
                disabled
                className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm font-medium"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Main Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}