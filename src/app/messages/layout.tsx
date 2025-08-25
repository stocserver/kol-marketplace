'use client'

import { ReactNode } from 'react'

interface MessagesLayoutProps {
  children: ReactNode
}

export default function MessagesLayout({ children }: MessagesLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}