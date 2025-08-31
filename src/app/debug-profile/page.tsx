'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugProfilePage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testProfileAccess = async () => {
    setLoading(true)
    setResult('')

    try {
      console.log('Testing profile access...')
      
      // Test 1: Can we access the profiles table at all?
      console.log('Test 1: Accessing profiles table...')
      const { data: allProfiles, error: listError } = await supabase
        .from('profiles')
        .select('id, username, full_name, user_type')
        .limit(10)

      console.log('All profiles result:', { data: allProfiles, error: listError })

      if (listError) {
        setResult(`❌ Cannot access profiles table: ${JSON.stringify(listError, null, 2)}`)
        setLoading(false)
        return
      }

      let debugInfo = `✅ Profiles table accessible\n`
      debugInfo += `📊 Found ${allProfiles?.length || 0} profiles:\n`
      
      if (allProfiles && allProfiles.length > 0) {
        allProfiles.forEach(profile => {
          debugInfo += `  - ID: ${profile.id}, Username: ${profile.username}, Type: ${profile.user_type}\n`
        })
      } else {
        debugInfo += `  (No profiles found in database)\n`
      }

      // Test 2: Try to get current user
      console.log('Test 2: Getting current user...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      console.log('Current user result:', { user: user?.id, error: authError })
      
      if (authError) {
        debugInfo += `\n❌ Auth error: ${JSON.stringify(authError, null, 2)}\n`
      } else if (user) {
        debugInfo += `\n✅ Current user ID: ${user.id}\n`
        
        // Test 3: Try to get current user's profile
        console.log('Test 3: Getting current user profile...')
        const { data: userProfile, error: userProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        console.log('User profile result:', { data: userProfile, error: userProfileError })

        if (userProfileError) {
          debugInfo += `❌ Error getting user profile: ${JSON.stringify(userProfileError, null, 2)}\n`
        } else if (userProfile) {
          debugInfo += `✅ Found user profile: ${userProfile.username}\n`
        } else {
          debugInfo += `⚠️ No profile found for current user\n`
        }
      } else {
        debugInfo += `\n⚠️ No authenticated user\n`
      }

      setResult(debugInfo)

    } catch (err) {
      console.error('Debug error:', err)
      setResult(`💥 Unexpected error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const testSpecificProfile = async () => {
    const testId = prompt('Enter a profile ID to test:')
    if (!testId) return

    setLoading(true)
    setResult('')

    try {
      console.log(`Testing specific profile ID: ${testId}`)
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testId)
        .single()

      console.log('Specific profile result:', { data: profileData, error: profileError })

      if (profileError) {
        setResult(`❌ Error getting profile ${testId}:\n${JSON.stringify(profileError, null, 2)}`)
      } else if (profileData) {
        setResult(`✅ Found profile ${testId}:\n${JSON.stringify(profileData, null, 2)}`)
      } else {
        setResult(`⚠️ No profile found with ID: ${testId}`)
      }

    } catch (err) {
      console.error('Test error:', err)
      setResult(`💥 Unexpected error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Profile Debug Tool</h1>
      
      <div className="space-y-4 mb-6">
        <button 
          onClick={testProfileAccess}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg disabled:opacity-50 mr-4"
        >
          {loading ? 'Testing...' : 'Test Profile Access'}
        </button>
        
        <button 
          onClick={testSpecificProfile}
          disabled={loading}
          className="bg-green-500 text-white px-6 py-3 rounded-lg disabled:opacity-50"
        >
          Test Specific Profile ID
        </button>
      </div>

      <div className="bg-gray-100 rounded-lg p-6 min-h-32">
        <h2 className="font-bold mb-4">Debug Results:</h2>
        {result ? (
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        ) : (
          <p className="text-gray-500">Click a button above to start debugging</p>
        )}
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>First, click "Test Profile Access" to check basic database connectivity</li>
          <li>If that works, try "Test Specific Profile ID" with a known profile ID</li>
          <li>Check the browser console for additional debug information</li>
        </ol>
      </div>
    </div>
  )
}