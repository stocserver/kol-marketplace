import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to see available columns
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({
        error: 'Profile query failed',
        details: profileError,
        user_id: user.id
      }, { status: 500 })
    }

    // Show all profile columns and their values
    return NextResponse.json({
      success: true,
      profile: profile,
      available_columns: Object.keys(profile || {}),
      user_id: user.id,
      user_email: user.email
    })

  } catch (error) {
    console.error('Debug profile error:', error)
    return NextResponse.json({ error: 'Debug failed', details: error }, { status: 500 })
  }
}