'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [debug, setDebug] = useState<Record<string, unknown>>({})
  
  const { user } = useAuth()
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult('')
      setImageUrl('')
      setDebug({})
    }
  }

  const testUpload = async () => {
    if (!file) {
      setResult('Please select a file first')
      return
    }

    if (!user) {
      setResult('Please log in first')
      return
    }

    setUploading(true)
    setResult('Starting upload...')

    try {
      // Debug info
      const { data: session, error: sessionError } = await supabase.auth.getSession()
      const debugInfo = {
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type
        },
        userInfo: {
          appUserId: user?.id,
          appUserEmail: user?.email,
          supabaseUserId: session?.session?.user?.id,
          supabaseUserEmail: session?.session?.user?.email,
          sessionError: sessionError
        },
        timestamp: new Date().toISOString()
      }
      
      setDebug(debugInfo)
      setResult(`Debug info collected. App User: ${user.id}, Supabase User: ${session?.session?.user?.id}`)

      // Create filename
      const fileExt = file.name.split('.').pop()
      const fileName = `test-${user.id}-${Date.now()}.${fileExt}`

      console.log('=== UPLOAD TEST DEBUG ===')
      console.log('File:', fileName, 'Size:', file.size)
      console.log('App User ID:', user.id)
      console.log('Supabase Session:', session?.session?.user?.id)
      console.log('Session Error:', sessionError)

      setResult(prev => prev + `\nAttempting to upload: ${fileName}`)

      // Test upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('gig-images')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Upload Error:', uploadError)
        setResult(prev => prev + `\n❌ Upload failed: ${uploadError.message}`)
        
        // Try to get more info about the error
        if (uploadError.message.includes('row-level security')) {
          setResult(prev => prev + '\n🔍 RLS Policy Issue: User not authorized to upload')
          
          // Check if bucket exists
          const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
          if (bucketsError) {
            setResult(prev => prev + `\n❌ Cannot list buckets: ${bucketsError.message}`)
          } else {
            const gigBucket = buckets.find(b => b.name === 'gig-images')
            setResult(prev => prev + `\n📁 Bucket exists: ${!!gigBucket}, Public: ${gigBucket?.public}`)
          }
        }
        
        return
      }

      setResult(prev => prev + `\n✅ Upload successful!`)
      console.log('Upload successful:', uploadData)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('gig-images')
        .getPublicUrl(fileName)

      if (urlData?.publicUrl) {
        setImageUrl(urlData.publicUrl)
        setResult(prev => prev + `\n🌐 Public URL: ${urlData.publicUrl}`)
      }

    } catch (error: unknown) {
      console.error('Test upload error:', error)
      setResult(prev => prev + `\n💥 Exception: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const testBucketAccess = async () => {
    setResult('Testing bucket access...')
    
    try {
      // Test listing buckets
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        setResult(prev => prev + `\n❌ Cannot list buckets: ${bucketsError.message}`)
      } else {
        setResult(prev => prev + `\n✅ Can list buckets: ${buckets.map(b => `${b.name} (public: ${b.public})`).join(', ')}`)
      }

      // Test accessing specific bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('gig-images')
        .list()

      if (filesError) {
        setResult(prev => prev + `\n❌ Cannot access gig-images bucket: ${filesError.message}`)
      } else {
        setResult(prev => prev + `\n✅ Can access gig-images bucket. Files: ${files.length}`)
      }

    } catch (error: unknown) {
      setResult(prev => prev + `\n💥 Bucket test exception: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Upload Test</h1>
          <p className="text-gray-600 mb-4">Please log in to test image uploads</p>
          <a href="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🧪 Supabase Storage Upload Test</h1>
          
          {/* User Info */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Current User</h2>
            <p className="text-blue-800">ID: {user.id}</p>
            <p className="text-blue-800">Email: {user.email}</p>
            <p className="text-blue-800">Username: {user.username}</p>
          </div>

          {/* File Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Image File
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={testBucketAccess}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Test Bucket Access
            </button>
            
            <button
              onClick={testUpload}
              disabled={!file || uploading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold"
            >
              {uploading ? 'Uploading...' : 'Test Upload'}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Results:</h3>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {result}
              </pre>
            </div>
          )}

          {/* Debug Info */}
          {Object.keys(debug).length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Debug Information:</h3>
              <pre className="whitespace-pre-wrap text-sm text-yellow-800 font-mono">
                {JSON.stringify(debug, null, 2)}
              </pre>
            </div>
          )}

          {/* Uploaded Image Preview */}
          {imageUrl && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-2">✅ Upload Successful!</h3>
              <img 
                src={imageUrl} 
                alt="Uploaded test image" 
                className="max-w-md max-h-64 object-contain border rounded"
              />
              <p className="text-sm text-green-700 mt-2 break-all">{imageUrl}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-1">
              <li>First click &quot;Test Bucket Access&quot; to check if you can access the storage</li>
              <li>Select an image file using the file input</li>
              <li>Click &quot;Test Upload&quot; to attempt the upload</li>
              <li>Check the results and debug information below</li>
              <li>Open browser console (F12) for additional technical details</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}