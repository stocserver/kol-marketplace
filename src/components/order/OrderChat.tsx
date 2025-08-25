'use client'

import { useState } from 'react'

interface OrderChatProps {
  orderId: string
  sellerId: string
}

export default function OrderChat({ orderId, sellerId }: OrderChatProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'buyer',
      message: 'Hi! I\'m excited to work with you on this project.',
      timestamp: '2024-08-24T10:00:00Z',
      senderName: 'You'
    },
    {
      id: 2,
      sender: 'seller',
      message: 'Thank you for choosing me! I\'ll start working on your content right away. Do you have any specific color preferences for the background?',
      timestamp: '2024-08-24T10:15:00Z',
      senderName: 'Emma Rodriguez'
    }
  ])

  const handleSendMessage = () => {
    if (!message.trim()) return

    const newMessage = {
      id: messages.length + 1,
      sender: 'buyer',
      message: message.trim(),
      timestamp: new Date().toISOString(),
      senderName: 'You'
    }

    setMessages([...messages, newMessage])
    setMessage('')
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
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'buyer' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="max-w-xs">
              <div className={`text-xs text-gray-600 mb-1 ${
                msg.sender === 'buyer' ? 'text-right' : 'text-left'
              }`}>
                {msg.senderName}
              </div>
              
              <div
                className={`px-3 py-2 rounded-lg text-sm ${
                  msg.sender === 'buyer'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}
              >
                {msg.message}
              </div>
              
              <div className={`text-xs text-gray-500 mt-1 ${
                msg.sender === 'buyer' ? 'text-right' : 'text-left'
              }`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
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
            disabled={!message.trim()}
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