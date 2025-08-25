'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MessageButtonProps {
  recipientId: string
  recipientName: string
  className?: string
}

export default function MessageButton({ recipientId, recipientName, className = '' }: MessageButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const startConversation = async () => {
    setLoading(true)
    try {
      // Check if messaging tables exist by trying to load conversations first
      const testResponse = await fetch('/api/messages/conversations')
      
      if (testResponse.status === 500) {
        // Tables probably don't exist yet
        alert('Messaging system is not yet set up. Please apply the database migration first.')
        setLoading(false)
        return
      }

      // Send an initial message to create the conversation
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId,
          content: `Hi ${recipientName}! I'm interested in your services.`
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        // Redirect to messages page
        router.push('/messages')
      } else {
        console.error('Failed to start conversation:', data.error || 'Unknown error')
        if (data.error?.includes('relation') || data.error?.includes('table')) {
          alert('Messaging system is not yet set up. Please apply the database migration first.')
        } else {
          alert(`Failed to start conversation: ${data.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Error starting conversation. Please make sure the messaging system is set up.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={startConversation}
      disabled={loading}
      className={`bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${className}`}
    >
      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.471L3 21l2.471-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
      </svg>
      {loading ? 'Starting...' : 'Message'}
    </button>
  )
}