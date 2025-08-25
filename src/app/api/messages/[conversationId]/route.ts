import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
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

    // Verify user is participant in this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, participant_1, participant_2')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    if (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get messages in this conversation with pagination
    // Order by descending to get latest first, then reverse for display
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        read_at,
        sender_id
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (messagesError) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Get sender profiles for all messages
    const senderIds = [...new Set(messages.map(m => m.sender_id))]
    const { data: senderProfiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', senderIds)

    // Add sender profile to each message and reverse to show oldest first
    const messagesWithSenders = messages.reverse().map(message => ({
      ...message,
      sender: senderProfiles?.find(p => p.id === message.sender_id) || {
        id: message.sender_id,
        username: 'unknown',
        full_name: 'Unknown User'
      }
    }))

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)

    // Mark messages as read (messages sent to current user)
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('recipient_id', user.id)
      .is('read_at', null)

    return NextResponse.json({ 
      messages: messagesWithSenders,
      totalCount: totalCount || 0,
      hasMore: (offset + limit) < (totalCount || 0)
    })

  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}