// Server-side usage only. Do not import this in client components.

type Recipient = { email: string; name?: string }

interface SendEmailOptions {
  to: Recipient[]
  subject: string
  text?: string
  html?: string
  category?: string
  fromEmail?: string
  fromName?: string
}

const MAILTRAP_ENDPOINT = 'https://send.api.mailtrap.io/api/send'

function getSmtpEnv() {
  const host = getEnv('MAILTRAP_SMTP_HOST')
  const portStr = getEnv('MAILTRAP_SMTP_PORT')
  const user = getEnv('MAILTRAP_SMTP_USER')
  const pass = getEnv('MAILTRAP_SMTP_PASSWORD')
  const secure = getEnv('MAILTRAP_SMTP_SECURE')
  return {
    host,
    port: portStr ? Number(portStr) : undefined,
    user,
    pass,
    secure: secure ? secure === 'true' : undefined,
  }
}

function getEnv(name: string) {
  const v = process.env[name]
  return typeof v === 'string' && v.trim().length > 0 ? v : undefined
}

function getTransportPreference(): 'api' | 'smtp' {
  const t = getEnv('MAILTRAP_TRANSPORT')
  return t === 'smtp' ? 'smtp' : 'api'
}

export function isEmailConfigured() {
  const transport = getTransportPreference()
  if (transport === 'smtp') {
    const smtp = getSmtpEnv()
    return Boolean(smtp.host && smtp.user && smtp.pass && getEnv('MAILTRAP_FROM_EMAIL'))
  }
  // default: api
  return Boolean(getEnv('MAILTRAP_TOKEN') && getEnv('MAILTRAP_FROM_EMAIL'))
}

async function sendWithSmtp(options: SendEmailOptions, fromEmail: string, fromName: string) {
  const smtp = getSmtpEnv()
  if (!smtp.host || !smtp.user || !smtp.pass) {
    throw new Error('SMTP not configured')
  }

  // Lazy import nodemailer to keep client bundles clean
  const nodemailerMod = await import('nodemailer')
  const nodemailer = nodemailerMod.default || nodemailerMod

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port ?? 587,
    secure: smtp.secure ?? false,
    auth: { user: smtp.user, pass: smtp.pass },
  })

  const info = await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: options.to.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)).join(', '),
    subject: options.subject,
    text: options.text,
    html: options.html,
    // Optional: custom headers
    headers: options.category ? { 'X-Category': options.category } : undefined,
  })

  return { ok: true, messageId: info.messageId, accepted: info.accepted, rejected: info.rejected }
}

export async function sendEmail(options: SendEmailOptions) {
  const fromEmail = options.fromEmail || getEnv('MAILTRAP_FROM_EMAIL')
  const fromName = options.fromName || getEnv('MAILTRAP_FROM_NAME') || 'Kol Marketplace'
  const category = options.category || getEnv('MAILTRAP_CATEGORY') || 'Transactional'
  const transport = getTransportPreference()

  if (transport === 'smtp') {
    if (!fromEmail) throw new Error('Email not configured. Missing MAILTRAP_FROM_EMAIL')
    return sendWithSmtp({ ...options, category }, fromEmail, fromName)
  }

  // API transport (default)
  const token = getEnv('MAILTRAP_TOKEN')
  if (!token || !fromEmail) {
    throw new Error('Email not configured. Set MAILTRAP_TOKEN and MAILTRAP_FROM_EMAIL')
  }

  const payload = {
    from: { email: fromEmail, name: fromName },
    to: options.to.map((r) => ({ email: r.email, name: r.name })),
    subject: options.subject,
    text: options.text,
    html: options.html,
    category,
  }

  const res = await fetch(MAILTRAP_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Mailtrap send failed: ${res.status} ${res.statusText} ${body}`)
  }

  try {
    return await res.json()
  } catch {
    return { ok: true }
  }
}

interface OrderEmailParams {
  to: string | Recipient
  orderId: string
  amount: number
  currency?: string
  orderUrl?: string
  buyerName?: string
  gigTitle?: string
  kolName?: string
}

export async function sendOrderReceivedEmail(params: OrderEmailParams) {
  const to: Recipient = typeof params.to === 'string' ? { email: params.to } : params.to
  const currency = params.currency || 'USD'

  const subject = `New Order Received #${params.orderId}`
  const text = [
    `You received a new order ${params.orderId}.`,
    params.gigTitle ? `Gig: ${params.gigTitle}` : undefined,
    params.buyerName ? `Buyer: ${params.buyerName}` : undefined,
    `Amount: ${params.amount} ${currency}`,
    params.orderUrl ? `View Order: ${params.orderUrl}` : undefined,
  ]
    .filter(Boolean)
    .join('\n')

  const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111">
    <h2 style="margin:0 0 12px">You received a new order</h2>
    <p style="margin:0 0 16px; color:#444">${params.kolName ? `${params.kolName}, ` : ''}great news - a buyer just placed an order.</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 520px">
      <tr>
        <td style="padding:8px; border:1px solid #eee; font-weight:600">Order ID</td>
        <td style="padding:8px; border:1px solid #eee">${params.orderId}</td>
      </tr>
      ${params.gigTitle ? `<tr><td style="padding:8px; border:1px solid #eee; font-weight:600">Gig</td><td style="padding:8px; border:1px solid #eee">${params.gigTitle}</td></tr>` : ''}
      ${params.buyerName ? `<tr><td style="padding:8px; border:1px solid #eee; font-weight:600">Buyer</td><td style="padding:8px; border:1px solid #eee">${params.buyerName}</td></tr>` : ''}
      <tr>
        <td style="padding:8px; border:1px solid #eee; font-weight:600">Amount</td>
        <td style="padding:8px; border:1px solid #eee">${params.amount} ${currency}</td>
      </tr>
    </table>
    ${
      params.orderUrl
        ? `<p style="margin:16px 0"><a href="${params.orderUrl}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">View Order</a></p>`
        : ''
    }
    <p style="margin:16px 0; color:#666; font-size:13px">This is an automated notification from Kol Marketplace.</p>
  </div>`

  return sendEmail({
    to: [to],
    subject,
    text,
    html,
    category: 'Order Notifications',
  })
}

export async function sendOrderDeliveredEmail(params: OrderEmailParams) {
  const to: Recipient = typeof params.to === 'string' ? { email: params.to } : params.to
  const currency = params.currency || 'USD'

  const subject = `Order Delivered #${params.orderId}`
  const text = [
    `Your order ${params.orderId} has been delivered!`,
    params.gigTitle ? `Gig: ${params.gigTitle}` : undefined,
    params.kolName ? `KOL: ${params.kolName}` : undefined,
    `Amount: ${params.amount} ${currency}`,
    `Please review the work and approve or request revisions.`,
    params.orderUrl ? `View Order: ${params.orderUrl}` : undefined,
  ]
    .filter(Boolean)
    .join('\n')

  const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111">
    <h2 style="margin:0 0 12px">Your order has been delivered!</h2>
    <p style="margin:0 0 16px; color:#444">${params.buyerName ? `${params.buyerName}, ` : ''}the KOL has completed your order and submitted their work for review.</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 520px">
      <tr>
        <td style="padding:8px; border:1px solid #eee; font-weight:600">Order ID</td>
        <td style="padding:8px; border:1px solid #eee">${params.orderId}</td>
      </tr>
      ${params.gigTitle ? `<tr><td style="padding:8px; border:1px solid #eee; font-weight:600">Gig</td><td style="padding:8px; border:1px solid #eee">${params.gigTitle}</td></tr>` : ''}
      ${params.kolName ? `<tr><td style="padding:8px; border:1px solid #eee; font-weight:600">KOL</td><td style="padding:8px; border:1px solid #eee">${params.kolName}</td></tr>` : ''}
      <tr>
        <td style="padding:8px; border:1px solid #eee; font-weight:600">Amount</td>
        <td style="padding:8px; border:1px solid #eee">${params.amount} ${currency}</td>
      </tr>
    </table>
    <p style="margin:16px 0; color:#444; font-size:14px">
      <strong>Next steps:</strong> Please review the delivered work and either approve it or request revisions if needed.
    </p>
    ${
      params.orderUrl
        ? `<p style="margin:16px 0"><a href="${params.orderUrl}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">Review Order</a></p>`
        : ''
    }
    <p style="margin:16px 0; color:#666; font-size:13px">This is an automated notification from Kol Marketplace.</p>
  </div>`

  return sendEmail({
    to: [to],
    subject,
    text,
    html,
    category: 'Order Notifications',
  })
}

interface RevisionEmailParams {
  to: string | Recipient
  orderId: string
  amount: number
  currency?: string
  orderUrl?: string
  sponsorName?: string
  gigTitle?: string
  revisionNote?: string
}

export async function sendRevisionRequestedEmail(params: RevisionEmailParams) {
  const to: Recipient = typeof params.to === 'string' ? { email: params.to } : params.to
  const currency = params.currency || 'USD'

  const subject = `Revision Requested for Order #${params.orderId}`
  const text = [
    `A revision has been requested for order ${params.orderId}.`,
    params.gigTitle ? `Gig: ${params.gigTitle}` : undefined,
    params.sponsorName ? `Sponsor: ${params.sponsorName}` : undefined,
    `Amount: ${params.amount} ${currency}`,
    params.revisionNote ? `Revision notes: ${params.revisionNote}` : undefined,
    params.orderUrl ? `View Order: ${params.orderUrl}` : undefined,
  ]
    .filter(Boolean)
    .join('\n')

  const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111">
    <h2 style="margin:0 0 12px">Revision Requested</h2>
    <p style="margin:0 0 16px; color:#444">The sponsor has requested revisions to your submitted work for order #${params.orderId}.</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 520px">
      <tr>
        <td style="padding:8px; border:1px solid #eee; font-weight:600">Order ID</td>
        <td style="padding:8px; border:1px solid #eee">${params.orderId}</td>
      </tr>
      ${params.gigTitle ? `<tr><td style="padding:8px; border:1px solid #eee; font-weight:600">Gig</td><td style="padding:8px; border:1px solid #eee">${params.gigTitle}</td></tr>` : ''}
      ${params.sponsorName ? `<tr><td style="padding:8px; border:1px solid #eee; font-weight:600">Sponsor</td><td style="padding:8px; border:1px solid #eee">${params.sponsorName}</td></tr>` : ''}
      <tr>
        <td style="padding:8px; border:1px solid #eee; font-weight:600">Amount</td>
        <td style="padding:8px; border:1px solid #eee">${params.amount} ${currency}</td>
      </tr>
    </table>
    ${
      params.revisionNote
        ? `<div style="margin:16px 0; padding:12px; background:#fff3cd; border-left:4px solid #ffc107; border-radius:4px">
             <p style="margin:0; color:#856404; font-weight:600; font-size:14px">Revision Notes:</p>
             <p style="margin:8px 0 0; color:#856404; font-size:14px">${params.revisionNote}</p>
           </div>`
        : ''
    }
    <p style="margin:16px 0; color:#444; font-size:14px">
      <strong>Next steps:</strong> Please review the feedback and submit updated work addressing the sponsor's concerns.
    </p>
    ${
      params.orderUrl
        ? `<p style="margin:16px 0"><a href="${params.orderUrl}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">View Order Details</a></p>`
        : ''
    }
    <p style="margin:16px 0; color:#666; font-size:13px">This is an automated notification from Kol Marketplace.</p>
  </div>`

  return sendEmail({
    to: [to],
    subject,
    text,
    html,
    category: 'Order Notifications',
  })
}

interface CompletionEmailParams {
  to: string | Recipient
  orderId: string
  amount: number
  currency?: string
  orderUrl?: string
  sponsorName?: string
  gigTitle?: string
}

export async function sendOrderCompletedEmail(params: CompletionEmailParams) {
  const to: Recipient = typeof params.to === 'string' ? { email: params.to } : params.to
  const currency = params.currency || 'USD'

  const subject = `Order Completed #${params.orderId}`
  const text = [
    `Your order ${params.orderId} has been marked as completed by the sponsor.`,
    params.gigTitle ? `Gig: ${params.gigTitle}` : undefined,
    params.sponsorName ? `Sponsor: ${params.sponsorName}` : undefined,
    `Amount: ${params.amount} ${currency}`,
    params.orderUrl ? `View Order: ${params.orderUrl}` : undefined,
  ]
    .filter(Boolean)
    .join('\n')

  const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111">
    <h2 style="margin:0 0 12px">Order Completed</h2>
    <p style="margin:0 0 16px; color:#444">The sponsor has marked order #${params.orderId} as completed.</p>
    <table style=\"border-collapse: collapse; width: 100%; max-width: 520px\">
      <tr>
        <td style=\"padding:8px; border:1px solid #eee; font-weight:600\">Order ID</td>
        <td style=\"padding:8px; border:1px solid #eee\">${params.orderId}</td>
      </tr>
      ${params.gigTitle ? `<tr><td style=\"padding:8px; border:1px solid #eee; font-weight:600\">Gig</td><td style=\"padding:8px; border:1px solid #eee\">${params.gigTitle}</td></tr>` : ''}
      ${params.sponsorName ? `<tr><td style=\"padding:8px; border:1px solid #eee; font-weight:600\">Sponsor</td><td style=\"padding:8px; border:1px solid #eee\">${params.sponsorName}</td></tr>` : ''}
      <tr>
        <td style=\"padding:8px; border:1px solid #eee; font-weight:600\">Amount</td>
        <td style=\"padding:8px; border:1px solid #eee\">${params.amount} ${currency}</td>
      </tr>
    </table>
    ${
      params.orderUrl
        ? `<p style=\"margin:16px 0\"><a href=\"${params.orderUrl}\" style=\"background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block\">View Order</a></p>`
        : ''
    }
    <p style=\"margin:16px 0; color:#666; font-size:13px\">This is an automated notification from Kol Marketplace.</p>
  </div>`

  return sendEmail({
    to: [to],
    subject,
    text,
    html,
    category: 'Order Notifications',
  })
}
