interface MessageInputProps {
  newMessage: string
  setNewMessage: (message: string) => void
  sendingMessage: boolean
  onSendMessage: () => void
  onKeyPress: (e: React.KeyboardEvent) => void
  theme: {
    primary: string
    primaryHover: string
    accent: string
    gradient: string
    text: string
  }
}

export default function MessageInput({
  newMessage,
  setNewMessage,
  sendingMessage,
  onSendMessage,
  onKeyPress,
  theme
}: MessageInputProps) {
  return (
    <div className="p-4 border-t border-gray-200">
      <div className="flex space-x-2">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="Type your message..."
          className="flex-1 resize-none px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          rows={1}
          style={{ minHeight: '40px' }}
        />
        <button
          onClick={onSendMessage}
          disabled={!newMessage.trim() || sendingMessage}
          className={`${theme.primary} ${theme.primaryHover} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {sendingMessage ? 'Sending...' : 'Send'}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">Press Enter to send</p>
    </div>
  )
}