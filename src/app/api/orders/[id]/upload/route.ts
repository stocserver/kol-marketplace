import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes
const ALLOWED_MIME_TYPES = ['video/mp4']

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify user is the KOL for this order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('kol_id, status')
      .eq('id', params.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.kol_id !== user.id) {
      return NextResponse.json({ error: 'Only the KOL can upload files for this order' }, { status: 403 })
    }

    if (!['in_progress', 'revision'].includes(order.status)) {
      return NextResponse.json({ error: 'Files can only be uploaded when order is in progress or revision' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const message = formData.get('message') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Only MP4 video files are allowed' 
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File size must be less than 5MB' 
      }, { status: 400 })
    }

    // Upload file to Supabase Storage
    const fileName = `${params.id}/${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('order-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('File upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('order-files')
      .getPublicUrl(fileName)

    // Save file record to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('order_files')
      .insert({
        order_id: params.id,
        filename: file.name,
        file_url: publicUrl,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: user.id
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to clean up uploaded file if database save fails
      await supabase.storage.from('order-files').remove([fileName])
      return NextResponse.json({ error: 'Failed to save file record' }, { status: 500 })
    }

    // Add message to order chat if provided
    if (message) {
      // Get user profile for proper sender name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .single()

      const senderName = profile?.full_name || profile?.username || 'User'

      await supabase
        .from('order_messages')
        .insert({
          order_id: params.id,
          sender_id: user.id,
          message: message,
          sender_name: senderName
        })
    }

    console.log('File uploaded successfully:', fileRecord.id)

    return NextResponse.json({
      success: true,
      file: fileRecord,
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}