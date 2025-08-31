'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestDbPage() {
  const [result, setResult] = useState<string>('')
  const supabase = createClient()

  const testBasicFields = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setResult('Not authenticated')
        return
      }

      // Test with only the original fields
      const basicData = {
        id: user.id,
        username: 'test_user_' + Date.now(),
        full_name: 'Test User',
        user_type: 'kol'
      }

      console.log('Testing basic fields:', basicData)
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert(basicData)
        .select()

      if (error) {
        setResult(`Error with basic fields: ${error.message}`)
      } else {
        setResult(`Success with basic fields: ${JSON.stringify(data)}`)
      }
    } catch (err) {
      setResult(`Catch error: ${err}`)
    }
  }

  const testEnhancedFields = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setResult('Not authenticated')
        return
      }

      // Test with enhanced fields
      const enhancedData = {
        id: user.id,
        username: 'test_enhanced_' + Date.now(),
        full_name: 'Test Enhanced User',
        user_type: 'kol',
        bio: 'Test bio',
        country: 'United States',
        languages: ['English'],
        followers: 1000
      }

      console.log('Testing enhanced fields:', enhancedData)
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert(enhancedData)
        .select()

      if (error) {
        setResult(`Error with enhanced fields: ${error.message}`)
      } else {
        setResult(`Success with enhanced fields: ${JSON.stringify(data)}`)
      }
    } catch (err) {
      setResult(`Catch error: ${err}`)
    }
  }

  const checkTableStructure = async () => {
    try {
      // Try to get the table structure by selecting a non-existent record
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)

      if (error) {
        setResult(`Table structure error: ${error.message}`)
      } else {
        setResult(`Table accessible. Sample data structure: ${JSON.stringify(data)}`)
      }
    } catch (err) {
      setResult(`Catch error: ${err}`)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Database Field Testing</h1>
      
      <div className="space-y-4">
        <button 
          onClick={checkTableStructure}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
        >
          Check Table Structure
        </button>
        
        <button 
          onClick={testBasicFields}
          className="bg-green-500 text-white px-4 py-2 rounded mr-4"
        >
          Test Basic Fields
        </button>
        
        <button 
          onClick={testEnhancedFields}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Test Enhanced Fields
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Result:</h2>
        <pre className="whitespace-pre-wrap">{result}</pre>
      </div>
    </div>
  )
}