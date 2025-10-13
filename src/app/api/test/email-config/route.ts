import { NextResponse } from 'next/server'
import { isEmailConfigured } from '@/lib/email'

export async function GET() {
  const transport = process.env.MAILTRAP_TRANSPORT === 'smtp' ? 'smtp' : 'api'
  const smtpConfigured = Boolean(
    process.env.MAILTRAP_SMTP_HOST &&
    process.env.MAILTRAP_SMTP_USER &&
    process.env.MAILTRAP_SMTP_PASSWORD &&
    process.env.MAILTRAP_FROM_EMAIL
  )
  const apiConfigured = Boolean(process.env.MAILTRAP_TOKEN && process.env.MAILTRAP_FROM_EMAIL)
  return NextResponse.json({
    configured: isEmailConfigured(),
    transport,
    fromEmail: process.env.MAILTRAP_FROM_EMAIL || null,
    hasToken: Boolean(process.env.MAILTRAP_TOKEN),
    smtpConfigured,
    smtpHost: process.env.MAILTRAP_SMTP_HOST || null,
    smtpUser: process.env.MAILTRAP_SMTP_USER || null,
    apiConfigured,
  })
}
