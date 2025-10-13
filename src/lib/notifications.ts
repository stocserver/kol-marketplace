// Server-side notifications helper
// Inserts in-app notifications via Supabase service role (bypass RLS on insert)
import { createServiceClient } from '@/lib/supabase/admin'

export type AppNotificationType = 'order_received' | 'revision_requested' | 'order_submitted' | 'order_completed' | 'order_disputed'

export type NotifyUserInput = {
  userId: string
  type: AppNotificationType
  title: string
  body?: string
  targetPath?: string
  meta?: Record<string, any>
}

export async function notifyUser(input: NotifyUserInput) {
  try {
    const admin = createServiceClient()
    const { error } = await admin
      .from('notifications')
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        body: input.body || null,
        target_path: input.targetPath || null,
        meta: input.meta || null,
      })

    if (error) {
      console.warn('[notifications] insert failed', error)
      return { ok: false, error }
    }
    return { ok: true }
  } catch (e) {
    console.warn('[notifications] unexpected failure', e)
    return { ok: false, error: e }
  }
}
