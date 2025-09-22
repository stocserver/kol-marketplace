import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    // Use service role key to execute admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create the order_submissions table using raw SQL
    const { data } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'order_submissions')
      .eq('table_schema', 'public')

    if (data && data.length > 0) {
      return NextResponse.json({ success: true, message: 'Table already exists' })
    }

    // Create table via direct SQL execution
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.order_submissions (
          id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
          order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
          submission_number integer NOT NULL,
          message text NOT NULL,
          submitted_by uuid NOT NULL REFERENCES auth.users(id),
          submitted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
          created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `

    const { error: createError } = await supabase.rpc('exec', { sql: createTableSQL })

    if (createError) {
      console.error('Error creating table:', createError)
      return NextResponse.json({
        error: 'Failed to create table',
        details: createError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'order_submissions table created successfully'
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}