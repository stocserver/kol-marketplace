'use client'

import { useState, useEffect, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface OrderChatProps {
  orderId: string
}

interface Message {
  id: string
  order_id: string
  sender_id: string
  sender_name: string
  message: string
  created_at: string
}

export default function OrderChat({ orderId }: OrderChatProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string; display_name?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    const container = scrollContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  useEffect(() => {
    let channel: RealtimeChannel | null
    const loadMessages = async () => {
      try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return
        
        // Get user profile for sender name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, username')
          .eq('id', user.id)
          .single()
        
        setCurrentUser({ 
          ...user, 
          display_name: profile?.full_name || profile?.username || 'You' 
        })

        // Load existing messages - exclude submission and file upload messages
        const { data: allMessages, error: messagesError } = await supabase
          .from('order_messages')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true })

        if (!messagesError && allMessages) {
          // Filter out submission and file upload messages on the client side
          const filteredMessages = allMessages.filter(msg => {
            const message = msg.message.toLowerCase()
            return !message.includes('submitted the work') &&
                   !message.includes('submitted work') &&
                   !message.includes('✅ i have submitted') &&
                   !message.includes('uploaded') &&
                   !message.includes('📹 uploaded') &&
                   !message.includes('🚀 i have started working')
          })
          setMessages(filteredMessages)
        }

        setLoading(false)

        // Subscribe to new messages
        channel = supabase
          .channel(`order_messages_${orderId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'order_messages',
              filter: `order_id=eq.${orderId}`
            },
            (payload) => {
              const newMessage = payload.new as Message
              const message = newMessage.message.toLowerCase()

              // Don't add submission or file upload messages to chat
              const isSubmissionMessage = message.includes('submitted the work') ||
                                        message.includes('submitted work') ||
                                        message.includes('✅ i have submitted') ||
                                        message.includes('uploaded') ||
                                        message.includes('📹 uploaded') ||
                                        message.includes('🚀 i have started working')

              if (!isSubmissionMessage) {
                setMessages(prev => [...prev, newMessage])
              }
            }
          )
          .subscribe()

        // cleanup happens in the effect's cleanup below
      } catch (error) {
        console.error('Error loading messages:', error)
        setLoading(false)
      }
    }

    loadMessages()
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [orderId, supabase])

  // Scroll to bottom when initial load completes
  useEffect(() => {
    if (!loading) {
      scrollToBottom('auto')
    }
  }, [loading])

  // Scroll to bottom whenever a new message arrives
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom('smooth')
    }
  }, [messages.length, loading])

  const handleSendMessage = async () => {
    if (!message.trim() || !currentUser) return

    try {
      const { error } = await supabase
        .from('order_messages')
        .insert({
          order_id: orderId,
          sender_id: currentUser.id,
          sender_name: currentUser.display_name,
          message: message.trim()
        })

      if (error) {
        console.error('Error sending message:', error)
        alert('Failed to send message. Please try again.')
        return
      }

      setMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Order Chat</h3>
        <p className="text-sm text-gray-600">Communicate directly with the KOL</p>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="h-64 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = currentUser && msg.sender_id === currentUser.id
            return (
              <div
                key={msg.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-xs">
                  <div className={`text-xs text-gray-600 mb-1 ${
                    isCurrentUser ? 'text-right' : 'text-left'
                  }`}>
                    {msg.sender_name}
                  </div>
                  
                  <div
                    className={`px-3 py-2 rounded-lg text-sm ${
                      isCurrentUser
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}
                  >
                    {msg.message}
                  </div>
                  
                  <div className={`text-xs text-gray-500 mt-1 ${
                    isCurrentUser ? 'text-right' : 'text-left'
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || !currentUser}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Press Enter to send</p>
      </div>
    </div>
  )
}
