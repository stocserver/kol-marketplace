'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DatabaseDebugPage() {
  const [results, setResults] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkDatabase = async () => {
      const checks: Record<string, unknown> = {}
      
      try {
        // Check if tables exist by trying to query them
        console.log('🔍 Checking database tables...')
        
        // Test profiles table
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
        
        checks.profiles = {
          exists: !profilesError,
          error: profilesError?.message,
          count: profiles?.length || 0,
          sampleData: profiles?.[0]
        }
        
        // Test gigs table
        const { data: gigs, error: gigsError } = await supabase
          .from('gigs')
          .select('*')
          .limit(1)
          
        checks.gigs = {
          exists: !gigsError,
          error: gigsError?.message,
          count: gigs?.length || 0,
          sampleData: gigs?.[0]
        }
        
        // Test orders table
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .limit(1)
          
        checks.orders = {
          exists: !ordersError,
          error: ordersError?.message,
          count: orders?.length || 0,
          sampleData: orders?.[0]
        }
        
        // Test reviews table (from our new migration)
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .limit(1)
          
        checks.reviews = {
          exists: !reviewsError,
          error: reviewsError?.message,
          count: reviews?.length || 0,
          sampleData: reviews?.[0]
        }
        
        // Test payment_attempts table
        const { data: paymentAttempts, error: paymentsError } = await supabase
          .from('payment_attempts')
          .select('*')
          .limit(1)
          
        checks.payment_attempts = {
          exists: !paymentsError,
          error: paymentsError?.message,
          count: paymentAttempts?.length || 0,
          sampleData: paymentAttempts?.[0]
        }
        
        // Test database functions
        try {
          const { data: ratingTest, error: ratingError } = await supabase
            .rpc('get_user_average_rating', { user_id: '00000000-0000-0000-0000-000000000000' })
          
          checks.functions = {
            get_user_average_rating: {
              exists: !ratingError,
              error: ratingError?.message,
              result: ratingTest
            }
          }
        } catch (err: unknown) {
          checks.functions = {
            get_user_average_rating: {
              exists: false,
              error: err instanceof Error ? err.message : 'Unknown error'
            }
          }
        }
        
        // Get current user info
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        checks.auth = {
          user: user ? {
            id: user.id,
            email: user.email
          } : null,
          error: authError?.message
        }
        
        console.log('📊 Database check results:', checks)
        setResults(checks)
        
      } catch (error: unknown) {
        console.error('💥 Database check failed:', error)
        setResults({ error: error instanceof Error ? error.message : 'Unknown error' })
      } finally {
        setLoading(false)
      }
    }
    
    checkDatabase()
  }, [supabase])

  const testOrderCreation = async () => {
    try {
      console.log('🧪 Testing order creation...')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please log in first')
        return
      }
      
      // Get a sample gig
      const { data: gig, error: gigError } = await supabase
        .from('gigs')
        .select('*')
        .limit(1)
        .single()
        
      if (gigError || !gig) {
        alert('No gigs available for testing')
        return
      }
      
      // Try creating a test order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          gig_id: gig.id,
          sponsor_id: user.id,
          kol_id: gig.kol_id,
          status: 'pending',
          amount: gig.price,
          platform_fee: Math.round(gig.price * 0.15),
          kol_earnings: gig.price - Math.round(gig.price * 0.15),
          requirements: 'Test order from debug page'
        })
        .select()
        .single()
        
      if (orderError) {
        console.error('❌ Order creation failed:', orderError)
        alert(`Order creation failed: ${orderError.message}`)
      } else {
        console.log('✅ Test order created:', order)
        alert(`Test order created successfully! ID: ${order.id}`)
        window.location.reload() // Refresh to see updated counts
      }
      
    } catch (error: unknown) {
      console.error('💥 Order creation test failed:', error)
      alert(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">🔍 Database Debug Page</h1>
          <p className="text-gray-600 mb-4">
            This page checks if your database tables exist and have data.
          </p>
          
          <button
            onClick={testOrderCreation}
            className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            🧪 Test Order Creation
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(results).map(([tableName, data]: [string, Record<string, unknown>]) => (
            <div key={tableName} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center">
                {data.exists ? '✅' : '❌'} {tableName}
              </h2>
              
              {data.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                  <p className="text-red-700 text-sm">
                    <strong>Error:</strong> {data.error}
                  </p>
                </div>
              )}
              
              {data.exists && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Records:</strong> {data.count}
                  </p>
                  
                  {data.sampleData && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        Sample data
                      </summary>
                      <pre className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(data.sampleData, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              {tableName === 'functions' && (
                <div className="mt-3">
                  {Object.entries(data).map(([funcName, funcData]: [string, Record<string, unknown>]) => (
                    <div key={funcName} className="mb-2">
                      <p className="text-sm">
                        <strong>{funcName}:</strong> {funcData.exists ? '✅' : '❌'}
                      </p>
                      {funcData.error && (
                        <p className="text-xs text-red-600">{funcData.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {tableName === 'auth' && (
                <div className="mt-3">
                  <p className="text-sm">
                    <strong>Current user:</strong> {data.user ? `${data.user.email} (${data.user.id})` : 'Not logged in'}
                  </p>
                  {data.error && (
                    <p className="text-xs text-red-600">{data.error}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}