import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { recipientId, content } = await request.json()
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

    // Validate input
    if (!recipientId || !content?.trim()) {
      return NextResponse.json({ error: 'Recipient and message content are required' }, { status: 400 })
    }

    // Check if recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', recipientId)
      .single()

    if (recipientError || !recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    // Find or create conversation
    let conversation
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${recipientId}),and(participant_1.eq.${recipientId},participant_2.eq.${user.id})`)
      .single()

    if (existingConversation) {
      conversation = existingConversation
    } else {
      // Create new conversation
      const { data: newConversation, error: newConvError } = await supabase
        .from('conversations')
        .insert({
          participant_1: user.id,
          participant_2: recipientId
        })
        .select('id')
        .single()

      if (newConvError) {
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
      }
      conversation = newConversation
    }

    // Insert message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        conversation_id: conversation.id,
        content: content.trim()
      })
      .select(`
        id,
        content,
        created_at,
        sender_id,
        recipient_id
      `)
      .single()

    if (messageError) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Get sender profile separately to avoid foreign key issues
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .eq('id', user.id)
      .single()

    // Add sender profile to message
    const messageWithSender = {
      ...message,
      sender: senderProfile
    }

    return NextResponse.json({ message: messageWithSender })

  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}