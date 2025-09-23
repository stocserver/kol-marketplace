'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRole } from '@/contexts/RoleContext'
import ConversationsList from './ConversationsList'
import MessagesArea from './MessagesArea'

interface Conversation {
  id: string
  created_at: string
  updated_at: string
  other_participant: {
    id: string
    username: string
    full_name: string
  }
  last_message: {
    id: string
    content: string
    created_at: string
    sender_id: string
  } | null
}

interface Message {
  id: string
  content: string
  created_at: string
  read_at: string | null
  sender_id: string
  sender: {
    id: string
    username: string
    full_name: string
  }
}

interface ConversationBoxProps {
  unreadConversations: Set<string>
  setUnreadConversations: (value: Set<string>) => void
  currentUser: { id: string; username: string; full_name: string } | null
  startNewChat?: string | null
  setStartNewChat?: (value: string | null) => void
}

export default function ConversationBox({ 
  unreadConversations, 
  setUnreadConversations, 
  currentUser,
  startNewChat,
  setStartNewChat
}: ConversationBoxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false)
  const [newChatRecipient, setNewChatRecipient] = useState<{ id: string; username: string; full_name: string } | null>(null)
  const { theme } = useRole()
  const supabase = createClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesStartRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Handle starting new chat with specific recipient
  useEffect(() => {
    if (startNewChat && conversations.length > 0) {
      // Look for existing conversation with this recipient
      const existingConversation = conversations.find(conv => 
        conv.other_participant.id === startNewChat
      )
      
      if (existingConversation) {
        // Select existing conversation
        setSelectedConversation(existingConversation.id)
      } else {
        // Start new conversation by prefilling message input
        setNewMessage(`Hello! I'm interested in your services.`)
        // We'll need the recipient info to show the new conversation
        loadRecipientInfo(startNewChat)
      }
      
      // Clear the startNewChat parameter
      setStartNewChat?.(null)
    }
  }, [startNewChat, conversations, setStartNewChat, loadRecipientInfo])

  // Set up polling for new messages every 10 seconds
  useEffect(() => {
    if (currentUser) {
      console.log('Setting up polling interval for user:', currentUser.id, 'selected conversation:', selectedConversation)
      const interval = setInterval(() => {
        console.log('Polling interval triggered - checking for new messages')
        checkForNewMessages()
      }, 10000) // 10 seconds for testing - change back to 30000 later

      return () => {
        console.log('Cleaning up polling interval')
        clearInterval(interval)
      }
    }
  }, [currentUser, selectedConversation, checkForNewMessages])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
      // Mark this conversation as read
      setUnreadConversations(prev => {
        const newSet = new Set(prev)
        newSet.delete(selectedConversation)
        return newSet
      })
    }
  }, [selectedConversation, loadMessages, setUnreadConversations])

  // Only auto-scroll when we specifically want to (new message sent/received)
  useEffect(() => {
    if (shouldAutoScroll && messages.length > 0) {
      console.log('Auto-scroll triggered, messages count:', messages.length)
      setTimeout(() => {
        console.log('Executing auto-scroll after timeout')
        scrollToBottom()
        setShouldAutoScroll(false)
      }, 150)
    }
  }, [shouldAutoScroll, messages.length])

  const scrollToBottom = () => {
    // Scroll only within the messages container, not the entire page
    if (messagesContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          console.log('Scrolling to bottom, container scrollHeight:', messagesContainerRef.current.scrollHeight)
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth'
          })
        }
      })
    }
  }

  // Check for new messages via polling
  const checkForNewMessages = useCallback(async () => {
    try {
      console.log('Checking for new messages...')
      console.log('Current user:', currentUser?.id)
      console.log('Selected conversation:', selectedConversation)
      
      // Reload conversations to get latest messages and detect unread ones
      const response = await fetch('/api/messages/conversations')
      const data = await response.json()
      
      if (response.ok) {
        const newConversations = data.conversations
        setConversations(newConversations)
        
        // Check for unread messages by comparing with last seen message timestamps
        const currentUnread = new Set<string>()
        
        newConversations.forEach((conv: Conversation) => {
          if (conv.last_message && 
              conv.last_message.sender_id !== currentUser?.id && 
              conv.id !== selectedConversation) {
            // Add to unread if this conversation has a message from someone else
            currentUnread.add(conv.id)
          }
        })
        
        // Show notification if we have new unread messages
        const previousUnreadCount = unreadConversations.size
        const newUnreadCount = currentUnread.size
        
        if (newUnreadCount > previousUnreadCount) {
          console.log('New unread messages detected!')
          
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Message', {
              body: `You have ${newUnreadCount} unread conversation${newUnreadCount > 1 ? 's' : ''}`,
              icon: '/favicon.ico',
              tag: 'new-message'
            })
          }
        }
        
        setUnreadConversations(currentUnread)
        
        // If we're in an active conversation, check if the conversation's last message changed
        if (selectedConversation) {
          console.log('Checking if selected conversation has new messages...')
          
          const selectedConv = newConversations.find(conv => conv.id === selectedConversation)
          if (selectedConv?.last_message) {
            console.log('Selected conversation last message:', selectedConv.last_message.id, selectedConv.last_message.content)
            
            // Check if we need to reload messages based on the conversation's last message
            setMessages(prevMessages => {
              const currentLastMessage = prevMessages[prevMessages.length - 1]
              
              if (!currentLastMessage) {
                console.log('No messages in state, will reload')
                // If no messages in state, trigger a reload
                loadMessagesOnly(selectedConversation, 0, false)
                return prevMessages
              }
              
              // If the conversation's last message is different from our last message, reload
              if (selectedConv.last_message.id !== currentLastMessage.id) {
                console.log('New message detected! Conversation last:', selectedConv.last_message.id, 'vs our last:', currentLastMessage.id)
                
                // Check if it's from someone else for auto-scroll
                if (selectedConv.last_message.sender_id !== currentUser?.id) {
                  console.log('Message is from someone else, will auto-scroll')
                  setShouldAutoScroll(true)
                }
                
                // Reload messages to get the new ones
                loadMessagesOnly(selectedConversation, 0, false)
              } else {
                console.log('No new messages in selected conversation')
              }
              
              return prevMessages
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to check for new messages:', error)
    }
  }, [currentUser?.id, selectedConversation, setConversations, setMessages, loadMessagesOnly, setUnreadConversations, unreadConversations.size])

  const loadRecipientInfo = useCallback(async (recipientId: string) => {
    try {
      const { data: recipient, error } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .eq('id', recipientId)
        .single()
      
      if (recipient && !error) {
        setNewChatRecipient(recipient)
        // Clear selected conversation to show new chat interface
        setSelectedConversation('new-chat')
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to load recipient info:', error)
    }
  }, [supabase])

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/messages/conversations')
      const data = await response.json()
      if (response.ok) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMessages = useCallback(async (conversationId: string) => {
    loadMessagesOnly(conversationId)
  }, [loadMessagesOnly])

  const loadMessagesOnly = useCallback(async (conversationId: string, offset = 0, append = false) => {
    try {
      const response = await fetch(`/api/messages/${conversationId}?limit=20&offset=${offset}`)
      const data = await response.json()
      if (response.ok) {
        if (append) {
          // Prepend older messages to the beginning
          setMessages(prev => [...data.messages, ...prev])
        } else {
          // Replace messages (initial load)
          setMessages(data.messages)
          // Only auto-scroll when first loading a conversation - with a delay
          setTimeout(() => {
            setShouldAutoScroll(true)
          }, 100)
        }
        setHasMoreMessages(data.hasMore)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }, [setMessages, setHasMoreMessages])

  const loadOlderMessages = async () => {
    if (!selectedConversation || loadingOlderMessages || !hasMoreMessages) return

    setLoadingOlderMessages(true)
    try {
      await loadMessagesOnly(selectedConversation, messages.length, true)
    } finally {
      setLoadingOlderMessages(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return

    let recipientId
    
    if (selectedConversation === 'new-chat' && newChatRecipient) {
      // New conversation
      recipientId = newChatRecipient.id
    } else if (selectedConversation) {
      // Existing conversation
      const conversation = conversations.find(c => c.id === selectedConversation)
      if (!conversation) return
      recipientId = conversation.other_participant.id
    } else {
      return
    }

    setSendingMessage(true)
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: recipientId,
          content: newMessage.trim()
        })
      })

      const data = await response.json()
      if (response.ok) {
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
        
        // If this was a new chat, we need to refresh conversations and select the new one
        if (selectedConversation === 'new-chat') {
          await loadConversations()
          setNewChatRecipient(null)
          // The conversation will be selected automatically when conversations refresh
        } else {
          // Refresh conversations to update last message
          loadConversations()
        }
        
        // Scroll to bottom after sending message
        setShouldAutoScroll(true)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
      <div className="flex h-full">
        <ConversationsList
          conversations={conversations}
          selectedConversation={selectedConversation}
          setSelectedConversation={setSelectedConversation}
          unreadConversations={unreadConversations}
          formatTime={formatTime}
        />
        <MessagesArea
          selectedConversation={selectedConversation}
          conversations={conversations}
          messages={messages}
          currentUser={currentUser}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendingMessage={sendingMessage}
          onSendMessage={sendMessage}
          onKeyPress={handleKeyPress}
          formatTime={formatTime}
          messagesEndRef={messagesEndRef}
          messagesStartRef={messagesStartRef}
          messagesContainerRef={messagesContainerRef}
          hasMoreMessages={hasMoreMessages}
          loadingOlderMessages={loadingOlderMessages}
          onLoadOlderMessages={loadOlderMessages}
          theme={theme}
          newChatRecipient={newChatRecipient}
        />
      </div>
    </div>
  )
}