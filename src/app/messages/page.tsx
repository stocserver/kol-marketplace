'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ConversationBox from '@/components/conversation/ConversationBox'

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; full_name: string } | null>(null)
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [startNewChat, setStartNewChat] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const supabase = createClient()

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user as { id: string; username: string; full_name: string } | null)
    setLoading(false)

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  useEffect(() => {
    getCurrentUser()
  }, [getCurrentUser])

  useEffect(() => {
    // Check if we have a recipient parameter to start a new conversation
    const recipientId = searchParams.get('recipient')
    if (recipientId && currentUser) {
      setStartNewChat(recipientId)
    }
  }, [searchParams, currentUser])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          {unreadConversations.size > 0 && (
            <div className="bg-blue-600 text-white text-sm font-medium px-2 py-1 rounded-full">
              {unreadConversations.size}
            </div>
          )}
        </div>
        <p className="text-gray-600 mt-2">Communicate with KOLs and sponsors</p>
      </div>

      <ConversationBox
        unreadConversations={unreadConversations}
        setUnreadConversations={setUnreadConversations}
        currentUser={currentUser}
        startNewChat={startNewChat}
        setStartNewChat={setStartNewChat}
      />
    </div>
  )
}