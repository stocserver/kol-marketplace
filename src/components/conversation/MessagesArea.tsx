import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'

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

interface MessagesAreaProps {
  selectedConversation: string | null
  conversations: Conversation[]
  messages: Message[]
  currentUser: { id: string; username: string; full_name: string } | null
  newMessage: string
  setNewMessage: (message: string) => void
  sendingMessage: boolean
  onSendMessage: () => void
  onKeyPress: (e: React.KeyboardEvent) => void
  formatTime: (dateString: string) => string
  messagesEndRef: React.RefObject<HTMLDivElement>
  messagesStartRef: React.RefObject<HTMLDivElement>
  messagesContainerRef: React.RefObject<HTMLDivElement>
  hasMoreMessages: boolean
  loadingOlderMessages: boolean
  onLoadOlderMessages: () => void
  theme: { primary: string; primaryHover: string; accent: string; gradient: string; text: string }
  newChatRecipient?: { id: string; username: string; full_name: string } | null
}

import { useEffect } from 'react'

export default function MessagesArea({
  selectedConversation,
  conversations,
  messages,
  currentUser,
  newMessage,
  setNewMessage,
  sendingMessage,
  onSendMessage,
  onKeyPress,
  formatTime,
  messagesEndRef,
  messagesStartRef,
  messagesContainerRef,
  hasMoreMessages,
  loadingOlderMessages,
  onLoadOlderMessages,
  theme,
  newChatRecipient
}: MessagesAreaProps) {
  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!messagesStartRef.current || !hasMoreMessages) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingOlderMessages) {
          console.log('Intersection observer triggered - loading older messages')
          onLoadOlderMessages()
        }
      },
      { threshold: 0.1, rootMargin: '20px' }
    )

    // Small delay to avoid triggering on initial load
    const timer = setTimeout(() => {
      if (messagesStartRef.current) {
        observer.observe(messagesStartRef.current)
      }
    }, 1000)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [hasMoreMessages, loadingOlderMessages, onLoadOlderMessages, messagesStartRef])

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.471L3 21l2.471-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Select a conversation</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose a conversation from the list to start messaging
          </p>
        </div>
      </div>
    )
  }

  const conversation = conversations.find(c => c.id === selectedConversation)
  const isNewChat = selectedConversation === 'new-chat'
  
  // Get participant info - either from existing conversation or new chat recipient
  const participant = isNewChat ? newChatRecipient : conversation?.other_participant

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        {participant && (
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                {participant.full_name || 'Unknown User'}
              </h3>
              <p className="text-sm text-blue-600">
                @{participant.username || 'unknown'}
              </p>
              {isNewChat && (
                <p className="text-xs text-gray-500 mt-1">
                  Start a new conversation
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages List */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {/* Load more trigger - invisible div at the top */}
        <div ref={messagesStartRef} className="h-1" />
        
        {/* Loading indicator for older messages */}
        {loadingOlderMessages && (
          <div className="text-center py-2">
            <div className="inline-flex items-center px-3 py-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
              Loading older messages...
            </div>
          </div>
        )}
        
        {/* "Load more" button if no intersection observer support */}
        {hasMoreMessages && !loadingOlderMessages && (
          <div className="text-center py-2">
            <button
              onClick={onLoadOlderMessages}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            >
              Load older messages
            </button>
          </div>
        )}

        {messages.map((message) => {
          const isCurrentUser = message.sender_id === currentUser?.id
          console.log('Message debug:', { 
            messageId: message.id, 
            senderId: message.sender_id, 
            currentUserId: currentUser?.id, 
            isCurrentUser,
            senderUsername: message.sender?.username 
          })
          
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={isCurrentUser}
              formatTime={formatTime}
            />
          )
        })}
        
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        
        {/* Invisible div to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        sendingMessage={sendingMessage}
        onSendMessage={onSendMessage}
        onKeyPress={onKeyPress}
        theme={theme}
      />
    </div>
  )
}