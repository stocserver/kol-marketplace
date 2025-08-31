'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function SimpleOrderPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    console.log('SimpleOrderPage mounted with params:', params)
    
    // Simulate loading
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Order #{String(params.id).slice(0, 8)}</h1>
      <p>This is a simplified order page for debugging.</p>
      
      <div className="mt-4 space-y-2">
        <p><strong>Order ID:</strong> {params.id}</p>
        <button 
          onClick={() => router.back()}
          className="bg-gray-600 text-white px-4 py-2 rounded"
        >
          Go Back
        </button>
      </div>
    </div>
  )
}