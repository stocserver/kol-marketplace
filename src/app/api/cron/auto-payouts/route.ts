import { NextRequest, NextResponse } from 'next/server'

// This endpoint can be called by a cron service (like Vercel Cron or external scheduler)
// to automatically process payouts for completed orders
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`
    
    if (!authHeader || authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🕐 Running scheduled auto-payout job')

    // Call the auto-approve API internally
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/admin/payouts/auto-approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use service role key for internal API calls
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Auto-approval failed: ${data.error}`)
    }

    console.log('✅ Scheduled auto-payout job completed:', data.summary)

    return NextResponse.json({
      success: true,
      message: 'Scheduled auto-payout job completed',
      timestamp: new Date().toISOString(),
      ...data
    })

  } catch (error) {
    console.error('❌ Scheduled auto-payout job failed:', error)
    return NextResponse.json({ 
      error: 'Cron job failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// POST endpoint for manual trigger (requires admin authentication)
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Manual auto-payout trigger requested')

    // Call the auto-approve API internally  
    const baseUrl = request.nextUrl.origin
    const response = await fetch(`${baseUrl}/api/admin/payouts/auto-approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      message: 'Manual auto-payout trigger completed',
      timestamp: new Date().toISOString(),
      ...data
    })

  } catch (error) {
    console.error('❌ Manual auto-payout trigger failed:', error)
    return NextResponse.json({ 
      error: 'Manual trigger failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}