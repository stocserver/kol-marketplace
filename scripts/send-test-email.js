// Simple CLI to test Mailtrap sending without running Next
// Usage: node scripts/send-test-email.js to@example.com "Subject" "Text body"
// Reads env from kol-marketplace/.env

/* eslint-disable no-console */
const path = require('path')
const https = require('https')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

function doFetch(url, options) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const req = https.request(
      {
        method: options.method || 'GET',
        hostname: u.hostname,
        path: u.pathname + (u.search || ''),
        headers: options.headers || {},
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            text: async () => data,
          })
        })
      }
    )
    req.on('error', reject)
    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

async function run() {
  const [, , to, subjectArg, textArg] = process.argv
  const token = process.env.MAILTRAP_TOKEN
  const from = process.env.MAILTRAP_FROM_EMAIL
  const fromName = process.env.MAILTRAP_FROM_NAME || 'Kol Marketplace'
  const category = process.env.MAILTRAP_CATEGORY || 'Transactional'

  if (!token || !from) {
    console.error('Missing MAILTRAP_TOKEN or MAILTRAP_FROM_EMAIL in .env')
    process.exit(2)
  }
  if (!to) {
    console.error('Usage: node scripts/send-test-email.js to@example.com "Subject" "Text body"')
    process.exit(2)
  }

  const subject = subjectArg || 'Mailtrap Test via CLI'
  const text = textArg || 'This is a CLI test email.'

  const payload = {
    from: { email: from, name: fromName },
    to: [{ email: to }],
    subject,
    text,
    html: `<p>${text}</p>`,
    category,
  }

  const res = await doFetch('https://send.api.mailtrap.io/api/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const body = await res.text()
  console.log('Status:', res.status, res.statusText)
  console.log('Response:', body)

  if (!res.ok) process.exit(3)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
