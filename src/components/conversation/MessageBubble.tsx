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

interface MessageBubbleProps {
  message: Message
  isCurrentUser: boolean
  formatTime: (dateString: string) => string
}

export default function MessageBubble({ message, isCurrentUser, formatTime }: MessageBubbleProps) {
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-xs lg:max-w-md">
        {/* Username label */}
        <div className={`text-xs text-gray-600 mb-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
          {isCurrentUser ? 'You' : `@${message.sender?.username || 'Unknown'}`}
        </div>
        
        {/* Message bubble */}
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm ${
            isCurrentUser
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
          <p
            className={`text-xs mt-2 ${
              isCurrentUser ? 'text-blue-100' : 'text-gray-500'
            }`}
          >
            {formatTime(message.created_at)}
            {message.read_at && isCurrentUser && (
              <span className="ml-2 text-blue-200">✓ Read</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}