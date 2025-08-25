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

interface ConversationsListProps {
  conversations: Conversation[]
  selectedConversation: string | null
  setSelectedConversation: (id: string) => void
  unreadConversations: Set<string>
  formatTime: (dateString: string) => string
}

export default function ConversationsList({
  conversations,
  selectedConversation,
  setSelectedConversation,
  unreadConversations,
  formatTime
}: ConversationsListProps) {
  return (
    <div className="w-1/3 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No conversations yet</p>
            <p className="text-sm mt-2">Start messaging with KOLs or sponsors!</p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const hasUnread = unreadConversations.has(conversation.id)
            return (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 relative ${
                  selectedConversation === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                } ${hasUnread ? 'bg-blue-25' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-medium truncate ${hasUnread ? 'text-gray-900 font-semibold' : 'text-gray-900'}`}>
                    {conversation.other_participant?.full_name || 'Unknown User'}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {hasUnread && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                    {conversation.last_message && (
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.last_message.created_at)}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-blue-600 truncate">
                  @{conversation.other_participant?.username || 'unknown'}
                </p>
                {conversation.last_message && (
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {conversation.last_message.content}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}