'use client'

import { useState } from 'react'

export default function TestOrderPage() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Test Order Page</h1>
      <p>This is a simplified test page to verify routing works.</p>
      
      <div className="mt-4">
        <button 
          onClick={() => setLoading(!loading)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Loading...' : 'Toggle Loading'}
        </button>
      </div>
    </div>
  )
}