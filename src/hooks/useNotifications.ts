'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export function useNotifications() {
  const supabase = createClient()
  const { user, loading: authLoading } = useAuth()
  const [count, setCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  const hasUnseen = useMemo(() => count > 0, [count])

  // Initial load + realtime subscription
  useEffect(() => {
    let channel: any = null
    let mounted = true

    async function load() {
      if (!user) {
        setCount(0)
        setLoading(false)
        return
      }

      try {
        const { count: unseenCount } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .is('seen_at', null)

        if (!mounted) return
        setCount(unseenCount || 0)
      } catch (_) {
        // table might not exist yet in some environments; fail silently
        if (!mounted) return
        setCount(0)
      } finally {
        if (mounted) setLoading(false)
      }

      try {
        channel = supabase
          .channel(`notifications_${user.id}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, () => {
            setCount((c) => c + 1)
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, (payload: any) => {
            const next = payload?.new
            const prev = payload?.old
            // If a notification transitioned from unseen to seen, reduce count.
            const becameSeen = (!prev?.seen_at && !!next?.seen_at) && !next?.deleted_at
            const gotDeletedUnseen = (!next?.seen_at && !!next?.deleted_at)
            if (becameSeen || gotDeletedUnseen) {
              setCount((c) => Math.max(0, c - 1))
            }
          })
          .subscribe()
      } catch (_) {
        // ignore realtime wiring failures
      }
    }

    if (!authLoading) load()

    return () => {
      mounted = false
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [authLoading, supabase, user?.id])

  const markAllSeen = async () => {
    if (!user) return
    try {
      await supabase
        .from('notifications')
        .update({ seen_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('seen_at', null)
        .is('deleted_at', null)
      setCount(0)
    } catch (_) {
      // ignore
    }
  }

  return { count, hasUnseen, loading, markAllSeen }
}
