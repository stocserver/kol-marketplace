'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

type NotificationType = 'order_received' | 'revision_requested' | 'order_submitted' | 'order_completed' | 'order_disputed'

type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  body?: string
  createdAt: string
  read: boolean
  seen: boolean
  targetPath: string
}

const typeStyles: Record<NotificationType, { bg: string; fg: string; icon: JSX.Element; label: string }> = {
  order_received: {
    bg: 'bg-blue-100',
    fg: 'text-blue-600',
    label: 'Order',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M5 7l1.5 12a2 2 0 002 1.8h7a2 2 0 002-1.8L19 7M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
      </svg>
    )
  },
  revision_requested: {
    bg: 'bg-yellow-100',
    fg: 'text-yellow-700',
    label: 'Revision',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    )
  },
  order_submitted: {
    bg: 'bg-green-100',
    fg: 'text-green-700',
    label: 'Submission',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    )
  },
  order_completed: {
    bg: 'bg-purple-100',
    fg: 'text-purple-700',
    label: 'Completed',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  order_disputed: {
    bg: 'bg-red-100',
    fg: 'text-red-700',
    label: 'Dispute',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 4.93a10 10 0 1114.14 14.14A10 10 0 014.93 4.93z" />
      </svg>
    )
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function NotificationsPage() {
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()
  const { markAllSeen } = useNotifications()

  // Mark all as seen when visiting the page
  useEffect(() => {
    markAllSeen()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  type DbNotification = {
    id: string
    type: NotificationType
    title: string
    body: string | null
    target_path: string | null
    meta: any
    created_at: string
    seen_at: string | null
    read_at: string | null
    deleted_at: string | null
  }

  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [page, setPage] = useState<number>(0)
  const pageSize = 20
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const mapRow = (n: DbNotification): NotificationItem => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body ?? undefined,
    createdAt: n.created_at,
    read: !!n.read_at,
    seen: !!n.seen_at,
    targetPath: n.target_path ?? '/'
  })

  const load = useCallback(async (reset = false) => {
    if (!user) {
      setItems([])
      setLoading(false)
      setHasMore(false)
      return
    }
    try {
      setLoading(true)
      const currentPage = reset ? 0 : page
      const from = currentPage * pageSize
      const to = from + pageSize - 1
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(from, to)
      if (error) throw error
      const mapped = (data as DbNotification[] | null)?.map(mapRow) ?? []
      setItems(prev => reset ? mapped : [...prev, ...mapped])
      setHasMore(mapped.length === pageSize)
      if (reset) setPage(1)
      else setPage(p => p + 1)
      setError(null)
    } catch (e: any) {
      setError(e?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, supabase, user])

  useEffect(() => {
    if (!authLoading) {
      load(true)
    }
  }, [authLoading, load])

  // Realtime: prepend new notifications for the current user
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`notifications_page_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload: any) => {
        const n = payload.new as DbNotification
        setItems(prev => [mapRow(n), ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, user])

  const markRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString(), seen_at: new Date().toISOString() })
        .eq('id', id)
        .is('deleted_at', null)
      setItems(prev => prev.map(i => i.id === id ? { ...i, read: true, seen: true } : i))
    } catch {}
  }

  const removeOne = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch {}
  }

  const clearAll = async () => {
    if (!user) return
    try {
      await supabase
        .from('notifications')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('deleted_at', null)
      setItems([])
      setHasMore(false)
    } catch {}
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            {items.filter(i => !i.read).length > 0 && (
              <div className="bg-blue-600 text-white text-sm font-medium px-2 py-1 rounded-full">
                {items.filter(i => !i.read).length}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={markAllSeen} className="text-sm px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700">Mark all as seen</button>
            <button onClick={clearAll} className="text-sm px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700">Clear all</button>
          </div>
        </div>
        <p className="text-gray-600 mt-2">Stay on top of orders, submissions, and revisions</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4 text-sm">{error}</div>
      )}

      {authLoading ? (
        <div className="bg-white border rounded-lg p-10 text-center text-gray-600">Loading...</div>
      ) : !user ? (
        <div className="bg-white border rounded-lg p-10 text-center text-gray-600">Sign in to view notifications</div>
      ) : items.length === 0 && !loading ? (
        <div className="bg-white border rounded-lg p-10 text-center text-gray-600">
          <div className="flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          No notifications yet
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const styles = typeStyles[item.type]
            const isUnread = !item.read
            return (
              <Link
                key={item.id}
                href={item.targetPath}
                onClick={() => { if (!item.read) markRead(item.id) }}
                className={`block bg-white border rounded-lg p-4 ${isUnread ? 'ring-1 ring-blue-100' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 ${styles.bg} ${styles.fg} w-10 h-10 rounded-full flex items-center justify-center`}>{styles.icon}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{item.title}</span>
                        {isUnread && <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />}
                      </div>
                      {item.body && <p className="text-gray-600 text-sm mt-1">{item.body}</p>}
                      <div className="text-xs text-gray-500 mt-2">{timeAgo(item.createdAt)}</div>
                      <div className="mt-3 flex items-center space-x-2">
                        {!item.read && (
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); markRead(item.id) }} className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100">Mark read</button>
                        )}
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeOne(item.id) }} className="text-xs px-2 py-1 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100">Remove</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 pl-3">
                    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            )
          })}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button disabled={loading} onClick={() => load(false)} className="text-sm px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-700 disabled:opacity-50">
                {loading ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
