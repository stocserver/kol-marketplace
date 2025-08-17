import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('Signup complete: Starting')
  
  try {
    const { userType, username, fullName } = await request.json()
    console.log('Signup complete: Data received:', { userType, username, fullName })

    const supabase = await createClient()
    console.log('Signup complete: Supabase client created')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('Signup complete: User check:', { userId: user?.id, userError: userError?.message })

    if (!user) {
      console.log('Signup complete: No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Signup complete: Creating profile for user:', user.id)
    // Create profile
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        user_type: userType,
        username,
        full_name: fullName,
      })

    console.log('Signup complete: Profile creation result:', { error: error?.message })

    if (error) {
      console.log('Signup complete: Profile creation failed:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('Signup complete: Success')
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Signup complete: Exception:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}