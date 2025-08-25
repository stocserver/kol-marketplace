import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/messages/conversations - Starting request')
    
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
    
    console.log('Supabase client created successfully')
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth check result:', { user: user?.id, authError })
    
    if (authError || !user) {
      console.log('Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all conversations for the user
    console.log('Fetching conversations for user:', user.id)
    
    // First, try a simple query to test if the table is accessible
    const { data: testQuery, error: testError } = await supabase
      .from('conversations')
      .select('id, participant_1, participant_2')
      .limit(1)
    
    console.log('Test query result:', { testQuery, testError })
    
    if (testError) {
      console.error('Basic table access failed:', testError)
      return NextResponse.json({ 
        error: 'Database access failed', 
        details: testError.message 
      }, { status: 500 })
    }
    
    // Get conversations first (without complex joins)
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        updated_at,
        participant_1,
        participant_2,
        last_message_id
      `)
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('updated_at', { ascending: false })

    console.log('Conversations query result:', { conversations, conversationsError })

    if (conversationsError) {
      console.error('Database error:', conversationsError)
      return NextResponse.json({ error: 'Failed to fetch conversations', details: conversationsError }, { status: 500 })
    }

    // Get user profiles for all participants
    const allParticipantIds = conversations.reduce((ids: string[], conv) => {
      if (!ids.includes(conv.participant_1)) ids.push(conv.participant_1)
      if (!ids.includes(conv.participant_2)) ids.push(conv.participant_2)
      return ids
    }, [])

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .in('id', allParticipantIds)

    // Get last messages if they exist
    const lastMessageIds = conversations
      .filter(conv => conv.last_message_id)
      .map(conv => conv.last_message_id)

    let lastMessages: any[] = []
    if (lastMessageIds.length > 0) {
      const { data: messagesData } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id')
        .in('id', lastMessageIds)
      lastMessages = messagesData || []
    }

    // Format conversations with actual user data
    const formattedConversations = conversations.map(conv => {
      const otherParticipantId = conv.participant_1 === user.id 
        ? conv.participant_2 
        : conv.participant_1
      
      const otherParticipant = profiles?.find(p => p.id === otherParticipantId) || {
        id: otherParticipantId,
        username: 'unknown',
        full_name: 'Unknown User'
      }
      
      const lastMessage = conv.last_message_id 
        ? lastMessages.find(m => m.id === conv.last_message_id)
        : null

      return {
        id: conv.id,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        other_participant: otherParticipant,
        last_message: lastMessage
      }
    })

    console.log('Returning formatted conversations:', formattedConversations)
    return NextResponse.json({ conversations: formattedConversations })

  } catch (error) {
    console.error('Get conversations error - full details:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}