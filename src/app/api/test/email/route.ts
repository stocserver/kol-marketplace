import { NextRequest, NextResponse } from 'next/server'
import { isEmailConfigured, sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as {
      to?: string
      subject?: string
      text?: string
      html?: string
      fromEmail?: string
      fromName?: string
      category?: string
    }

    if (!isEmailConfigured()) {
      return NextResponse.json({
        ok: false,
        error: 'Email not configured. Set MAILTRAP_TOKEN and MAILTRAP_FROM_EMAIL in .env',
      }, { status: 400 })
    }

    const to = (body.to || process.env.MAILTRAP_TEST_TO || '').trim()
    if (!to) {
      return NextResponse.json({
        ok: false,
        error: 'Missing recipient. Provide "to" in body or set MAILTRAP_TEST_TO.'
      }, { status: 400 })
    }

    const subject = body.subject || 'Mailtrap Test from /api/test/email'
    const text = body.text || 'This is a test email sent from the test API route.'
    const html = body.html || `<p>${text}</p>`

    const result = await sendEmail({
      to: [{ email: to }],
      subject,
      text,
      html,
      fromEmail: body.fromEmail,
      fromName: body.fromName,
      category: body.category,
    })

    return NextResponse.json({ ok: true, result })
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}

