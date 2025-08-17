import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('Auth callback: Starting')
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  console.log('Auth callback: Code received:', !!code)

  if (code) {
    try {
      console.log('Auth callback: Creating Supabase client')
      const supabase = await createClient()
      
      console.log('Auth callback: Exchanging code for session')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      console.log('Auth callback: Exchange result:', { 
        hasSession: !!data.session, 
        hasUser: !!data.user,
        error: error?.message 
      })
      
      if (!error && data.session) {
        console.log('Auth callback: Session exchange successful')
        
        // Create the redirect response first
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        console.log('Auth callback: Profile found:', !!profile)

        // Pass session data to auth-success page via URL params
        const redirectPath = `/auth-success?access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&user_id=${data.user.id}`
        console.log('Auth callback: Redirecting to:', redirectPath)
        
        // Create redirect response
        const redirectResponse = NextResponse.redirect(`${origin}${redirectPath}`)
        
        // Make sure cookies are set in the response
        // The session should already be set by the Supabase client, but let's ensure it
        console.log('Auth callback: Setting session cookies')
        
        return redirectResponse
      } else {
        console.log('Auth callback: Session exchange failed:', error?.message)
      }
    } catch (err) {
      console.error('Auth callback error:', err)
    }
  } else {
    console.log('Auth callback: No code provided')
  }

  console.log('Auth callback: Falling back to login redirect')
  return NextResponse.redirect(`${origin}/login`)
}