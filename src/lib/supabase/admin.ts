// Server-only Supabase admin client (uses service role key)
// Do NOT import this in client components.
import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service role configuration')
  }
  return createClient(url, serviceKey)
}

