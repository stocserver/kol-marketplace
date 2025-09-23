import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', details: authError }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, email, username')
      .eq('id', user.id)
      .single()

    console.log('Admin test - User:', user.email)
    console.log('Admin test - Profile:', profile)

    const isAdmin = profile?.user_type === 'admin' || 
                    user.email === 'admin@kolmarketplace.com' || 
                    user.email?.endsWith('@admin.com') ||
                    user.email === 'ivn.c.yu@gmail.com'

    // Check if payout_requests table exists and has data
    const { count: payoutCount, error: tableError } = await supabase
      .from('payout_requests')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      profile,
      isAdmin,
      profileError,
      tableExists: !tableError,
      tableError: tableError?.message,
      payoutRequestsCount: payoutCount || 0
    })

  } catch (error) {
    console.error('Admin test error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}