'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
// import { useRole } from '@/contexts/RoleContext'
import { createClient } from '@/lib/supabase/client'
import OrderTimeline from '@/components/order/OrderTimeline'
import OrderChat from '@/components/order/OrderChat'
import OrderReview from '@/components/order/OrderReview'
import { Order, Profile } from '@/types'

interface User {
  id: string
  email?: string
}

interface OrderFile {
  id: string
  filename: string
  file_url: string
  file_size: number
  created_at: string
}

interface Review {
  id: string
  order_id: string
  rating: number
  comment?: string
  created_at: string
}

// Order workflow statuses
const ORDER_STATUSES = {
  PENDING: 'pending',
  PAID: 'paid',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  REVISION: 'revision',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

export default function OrderDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<OrderFile[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadMessage, setUploadMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [userProfile] = useState<Profile | null>(null)
  const [submissionMessage, setSubmissionMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingReview, setExistingReview] = useState<Review | null>(null)
  // const { theme } = useRole()
  const theme = {
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700'
  }
  const supabase = createClient()
  const isSuccess = searchParams.get('success') === 'true'

  // Create comprehensive timeline with consistent workflow
  const createTimeline = async (currentStatus: string, timestamps: Record<string, unknown>, orderData: Order) => {
    const baseSteps = [
      {
        id: 1,
        type: 'order_created',
        title: 'Order Placed',
        description: 'Order has been placed successfully',
        timestamp: timestamps.order_created || orderData.created_at,
        status: 'completed'
      },
      {
        id: 2,
        type: 'payment_confirmed',
        title: 'Payment Confirmed',
        description: 'Payment has been processed and confirmed',
        timestamp: currentStatus !== 'pending' ? (timestamps.payment_confirmed || orderData.created_at) : null,
        status: currentStatus !== 'pending' ? 'completed' : 'pending'
      }
    ]

    // Add work-related steps based on current status
    if ([ORDER_STATUSES.IN_PROGRESS, ORDER_STATUSES.SUBMITTED, ORDER_STATUSES.REVISION, ORDER_STATUSES.DELIVERED, ORDER_STATUSES.COMPLETED].includes(currentStatus)) {
      baseSteps.push({
        id: 3,
        type: 'work_started',
        title: 'Work Started',
        description: 'KOL has started working on your content',
        timestamp: timestamps.work_started || orderData.updated_at,
        status: 'completed'
      })
    } else if (currentStatus === ORDER_STATUSES.PAID) {
      baseSteps.push({
        id: 3,
        type: 'work_started',
        title: 'Work Started',
        description: 'Waiting for KOL to start work',
        timestamp: null,
        status: 'current'
      })
    }

    // Get file upload messages (still from order_messages for now)
    const { data: fileMessages } = await supabase
      .from('order_messages')
      .select('*')
      .eq('order_id', orderData.id)
      .ilike('message', '%uploaded%')
      .order('created_at', { ascending: true })

    let nextId = 4

    // Get all submissions from the new order_submissions table
    const { data: submissions, error: submissionsError } = await supabase
      .from('order_submissions')
      .select('*')
      .eq('order_id', orderData.id)
      .order('submission_number', { ascending: true })

    // Add all submission entries to timeline (if table exists)
    if (!submissionsError && submissions && submissions.length > 0) {
      submissions.forEach((submission) => {
        const ordinal = submission.submission_number === 1 ? '1st' :
                       submission.submission_number === 2 ? '2nd' :
                       submission.submission_number === 3 ? '3rd' :
                       `${submission.submission_number}th`

        baseSteps.push({
          id: nextId++,
          type: 'work_submitted',
          title: `Work Submitted (${ordinal} Submission)`,
          description: `${orderData.kol?.full_name || orderData.kol?.username || 'KOL'} submitted the ${ordinal} version of work`,
          timestamp: submission.submitted_at,
          status: 'completed',
          submissionData: {
            number: submission.submission_number,
            ordinal: ordinal,
            message: submission.message,
            sender: orderData.kol?.full_name || orderData.kol?.username || 'KOL'
          }
        })
      })
    } else if (submissionsError) {
      // Fallback: If submissions table doesn't exist, check if order status indicates submission
      console.log('📊 Fallback: checking order data for submissions', {
        status: currentStatus,
        submission_count: orderData.submission_count,
        last_submission_message: orderData.last_submission_message,
        last_submission_at: orderData.last_submission_at
      })

      if (orderData.submission_count && orderData.submission_count > 0) {
        const ordinal = orderData.submission_count === 1 ? '1st' :
                       orderData.submission_count === 2 ? '2nd' :
                       orderData.submission_count === 3 ? '3rd' :
                       `${orderData.submission_count}th`

        baseSteps.push({
          id: nextId++,
          type: 'work_submitted',
          title: `Work Submitted (${ordinal} Submission)`,
          description: `${orderData.kol?.full_name || orderData.kol?.username || 'KOL'} submitted the ${ordinal} version of work`,
          timestamp: orderData.last_submission_at,
          status: 'completed',
          submissionData: {
            number: orderData.submission_count,
            ordinal: ordinal,
            message: orderData.last_submission_message || 'Work submitted for review',
            sender: orderData.kol?.full_name || orderData.kol?.username || 'KOL'
          }
        })
      } else if (currentStatus === 'submitted') {
        // If status is submitted but no submission data, show generic submission
        baseSteps.push({
          id: nextId++,
          type: 'work_submitted',
          title: 'Work Submitted (1st Submission)',
          description: `${orderData.kol?.full_name || orderData.kol?.username || 'KOL'} submitted work for review`,
          timestamp: orderData.updated_at,
          status: 'completed',
          submissionData: {
            number: 1,
            ordinal: '1st',
            message: 'Work submitted for review',
            sender: orderData.kol?.full_name || orderData.kol?.username || 'KOL'
          }
        })
      }
    }

    // Add file upload entries
    (fileMessages || []).forEach((message) => {
      baseSteps.push({
        id: nextId++,
        type: 'file_uploaded',
        title: 'File Uploaded',
        description: 'KOL uploaded a file',
        timestamp: message.created_at,
        status: 'completed',
        fileData: {
          message: message.message,
          sender: message.sender_name
        }
      })
    })

    // Add current status indicators based on order state
    const hasSubmissions = (!submissionsError && submissions && submissions.length > 0) ||
                          (submissionsError && orderData.submission_count && orderData.submission_count > 0)

    if (currentStatus === 'submitted' && hasSubmissions) {
      // If submitted, show awaiting review after the latest submission
      baseSteps.push({
        id: nextId++,
        type: 'awaiting_review',
        title: 'Awaiting Review',
        description: 'Waiting for sponsor approval',
        timestamp: null,
        status: 'current'
      })
    } else if (currentStatus === 'revision') {
      // If revision requested, show revision workflow
      baseSteps.push({
        id: nextId++,
        type: 'revision_requested',
        title: 'Revision Requested',
        description: 'Sponsor has requested changes to the work',
        timestamp: timestamps.revision_requested || orderData.updated_at,
        status: 'completed'
      })
      baseSteps.push({
        id: nextId++,
        type: 'revision_in_progress',
        title: 'Working on Revision',
        description: 'KOL is working on the requested changes',
        timestamp: null,
        status: 'current'
      })
    } else if (['delivered', 'completed'].includes(currentStatus)) {
      // If completed, show approval step
      baseSteps.push({
        id: nextId++,
        type: 'work_approved',
        title: 'Work Approved',
        description: 'Sponsor has approved the deliverables',
        timestamp: timestamps.work_approved || orderData.updated_at,
        status: 'completed'
      })
    } else if (currentStatus === 'in_progress') {
      // If in progress, show work in progress
      baseSteps.push({
        id: nextId++,
        type: 'work_in_progress',
        title: 'Work in Progress',
        description: 'KOL is working on your content',
        timestamp: null,
        status: 'current'
      })
    }

    // Add final completion step
    if (currentStatus === 'completed') {
      baseSteps.push({
        id: baseSteps.length + 1,
        type: 'order_completed',
        title: 'Order Completed',
        description: 'Order has been completed successfully',
        timestamp: timestamps.order_completed || orderData.updated_at,
        status: 'completed'
      })
    }

    return baseSteps
  }

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true)
        setError('')

        // Get authenticated user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        if (authError || !authUser) {
          router.push('/login')
          return
        }
        
        setUser(authUser)

        // Check if this is a mock order ID format (starts with "order_")
        if (typeof params.id === 'string' && params.id.startsWith('order_')) {
          console.log('🚨 Detected mock order ID:', params.id)
          console.log('Clearing old mock data from localStorage...')
          
          // Clear old mock data
          localStorage.removeItem('mockOrders')
          
          setError(
            'This appears to be an old test order. Please create a new order through the checkout process.'
          )
          return
        }

        console.log('Fetching order with ID:', params.id)
        console.log('User ID:', authUser.id)

        // First, try to fetch order without joins to isolate the issue
        const { data: basicOrder, error: basicError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', params.id)
          .single()

        console.log('Basic order query result:', { basicOrder, basicError })

        if (basicError) {
          console.error('Basic order fetch error:', basicError)
          if (basicError.code === 'PGRST116') {
            setError('Order not found')
          } else {
            setError(`Failed to load order: ${basicError.message || 'Unknown error'}`)
          }
          return
        }

        // Check if user has access to this order
        if (basicOrder.sponsor_id !== authUser.id && basicOrder.kol_id !== authUser.id) {
          console.log('Access denied. User:', authUser.id, 'Sponsor:', basicOrder.sponsor_id, 'KOL:', basicOrder.kol_id)
          setError('You do not have access to this order')
          return
        }

        // Now fetch related data separately to avoid join issues
        console.log('Fetching related data...')
        const [gigResult, sponsorResult, kolResult] = await Promise.all([
          supabase.from('gigs').select('*').eq('id', basicOrder.gig_id).single(),
          supabase.from('profiles').select('id, username, full_name, avatar_url').eq('id', basicOrder.sponsor_id).single(),
          supabase.from('profiles').select('id, username, full_name, avatar_url').eq('id', basicOrder.kol_id).single()
        ])

        console.log('Related data results:', { gigResult, sponsorResult, kolResult })

        if (gigResult.error || sponsorResult.error || kolResult.error) {
          console.error('Error fetching related data:', { 
            gigError: gigResult.error, 
            sponsorError: sponsorResult.error, 
            kolError: kolResult.error 
          })
          setError('Failed to load complete order details')
          return
        }

        // Manually construct the order data
        const orderData = {
          ...basicOrder,
          gig: gigResult.data,
          sponsor: sponsorResult.data,
          kol: kolResult.data
        }

        console.log('Final order data:', orderData)

        const activities = await createTimeline(orderData.status, {
          order_created: orderData.created_at,
          payment_confirmed: orderData.created_at,
          work_started: orderData.updated_at,
          work_submitted: orderData.updated_at,
          revision_requested: orderData.updated_at,
          work_approved: orderData.updated_at,
          order_completed: orderData.updated_at
        }, orderData)

        // Calculate delivery date
        const deliveryDate = new Date(orderData.created_at)
        const deliveryDays = orderData.gig.delivery_days
        deliveryDate.setDate(deliveryDate.getDate() + deliveryDays)

        const processedOrder = {
          ...orderData,
          deliveryDate: deliveryDate.toISOString(),
          activities,
          // For compatibility with existing UI
          sellerId: orderData.kol_id,
          fastDelivery: orderData.gig.fast_delivery
        }

        setOrder(processedOrder)
      } catch (err) {
        console.error('Error loading order:', err)
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
    loadOrderFiles()
    loadExistingReview()

    // Set up real-time subscription for order status changes
    const channel = supabase
      .channel(`order_${params.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${params.id}`
        },
        (payload) => {
          console.log('Order updated:', payload)
          if (payload.new) {
            setOrder((currentOrder: Order | null) => {
              if (!currentOrder) return currentOrder

              const updatedOrder = { ...currentOrder, ...payload.new }

              // For real-time updates, use simple timeline without dynamic submission counting
              // The submission count will be updated when the user refreshes or navigates
              const simpleActivities = currentOrder.activities || []

              return { ...updatedOrder, activities: simpleActivities }
            })
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [params.id, router, supabase])

  const loadOrderFiles = async () => {
    try {
      // Check if order_files table exists and is accessible
      const { data: files, error } = await supabase
        .from('order_files')
        .select('*')
        .eq('order_id', params.id)
        .order('created_at', { ascending: false })

      if (error) {
        // Common Supabase errors for missing tables/permissions
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.info('Order files feature not available - table may not exist yet')
        } else {
          console.warn('Order files query failed:', error)
        }
        // Always set empty array as fallback
        setUploadedFiles([])
      } else {
        setUploadedFiles(files || [])
      }
    } catch (error) {
      console.info('Order files feature unavailable:', error)
      // Set empty array as fallback to prevent page crash
      setUploadedFiles([])
    }
  }

  const loadExistingReview = async () => {
    try {
      const { data: review, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, kol_response, kol_response_at, created_at')
        .eq('order_id', params.id)
        .single()

      if (error) {
        if (error.code !== 'PGRST116') {
          console.warn('Review query failed:', error)
        }
        setExistingReview(null)
      } else {
        setExistingReview(review)
      }
    } catch (error) {
      console.info('Reviews feature unavailable:', error)
      setExistingReview(null)
    }
  }


  const handleFileUpload = async () => {
    if (!selectedFile || !order) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Create a simple message for file upload
      const fileMessage = uploadMessage
        ? `📹 Uploaded ${selectedFile.name}. ${uploadMessage}`
        : `📹 Uploaded ${selectedFile.name}.`

      formData.append('message', fileMessage)

      const response = await fetch(`/api/orders/${order.id}/upload`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        alert('File uploaded successfully!')
        setSelectedFile(null)
        setUploadMessage('')

        // Clear file input
        const fileInput = document.querySelector('input[type=\"file\"]') as HTMLInputElement
        if (fileInput) fileInput.value = ''

        // Reload files
        await loadOrderFiles()

        // Note: Don't automatically change status to submitted when uploading files
        // Let users choose when to submit via the standalone button
      } else {
        alert(result.error || 'Failed to upload file')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }



  // Helper function to count submissions by looking at submission messages
  const getSubmissionCount = async (): Promise<number> => {
    try {
      // Get current submission count from order_submissions table
      const { data: submissions, error } = await supabase
        .from('order_submissions')
        .select('submission_number')
        .eq('order_id', order.id)
        .order('submission_number', { ascending: false })
        .limit(1)

      if (error) {
        console.warn('Could not get submission count:', error)
        return 1
      }

      // Return the next submission number
      return (submissions?.[0]?.submission_number || 0) + 1
    } catch (error) {
      console.warn('Error getting submission count:', error)
      return 1
    }
  }

  const updateOrderStatus = async (newStatus: string, customMessage?: string) => {
    try {
      setIsSubmitting(true)

      if (!order || !order.id) {
        console.error('No order found or missing order ID')
        alert('Order not found. Please refresh the page.')
        return
      }

      if (!user) {
        console.error('No authenticated user')
        alert('Please log in again.')
        return
      }

      console.log('Updating order:', {
        orderId: order.id,
        currentStatus: order.status,
        newStatus: newStatus,
        userId: user.id
      })

      let submissionCount = 1

      if (newStatus === 'submitted') {
        submissionCount = await getSubmissionCount()
      }

      // Update order status
      const { error, data } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id)
        .select()

      if (error) {
        console.error('Error updating order status:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        alert(`Failed to update order status: ${error.message || 'Unknown error'}`)
        return
      }

      console.log('Order updated successfully:', data)

      // DON'T create any automatic chat messages - chat is only for manual conversation
      // All status updates should only appear in timeline, not in chat

      // For submissions, try to store in order_submissions table, fallback to order table
      if (newStatus === 'submitted') {
        try {
          const submissionMessage = customMessage || 'Work submitted for review'

          // Try to store in order_submissions table first
          const { error: submissionError } = await supabase
            .from('order_submissions')
            .insert({
              order_id: order.id,
              submission_number: submissionCount,
              message: submissionMessage,
              submitted_by: user.id
            })

          if (submissionError) {
            console.warn('order_submissions table not available, using fallback storage:', submissionError)

            // Fallback: Store in order table for now
            await supabase
              .from('orders')
              .update({
                last_submission_message: submissionMessage,
                last_submission_at: new Date().toISOString(),
                submission_count: submissionCount
              })
              .eq('id', order.id)
          } else {
            console.log('✅ Submission stored successfully:', submissionCount)
          }
        } catch (error) {
          console.warn('Could not store submission details:', error)
        }
      }

      // Update local state and refresh timeline
      const updatedOrder = { ...order, status: newStatus }

      // Recreate timeline with new status
      const activities = await createTimeline(newStatus, {
        order_created: order.created_at,
        payment_confirmed: order.created_at,
        work_started: order.updated_at,
        work_submitted: order.updated_at,
        revision_requested: newStatus === 'revision' ? new Date().toISOString() : order.updated_at,
        work_approved: ['completed'].includes(newStatus) ? new Date().toISOString() : order.updated_at,
        order_completed: newStatus === 'completed' ? new Date().toISOString() : order.updated_at
      }, updatedOrder)

      setOrder({ ...updatedOrder, activities })

      // Show success message
      const statusMessages = {
        'in_progress': 'Work started successfully!',
        'submitted': 'Work submitted for review!',
        'completed': 'Order completed successfully!',
        'revision': 'Revision requested. KOL will be notified.'
      }

      alert(statusMessages[newStatus] || 'Order status updated')

      // Clear submission message after successful submission
      if (newStatus === 'submitted') {
        setSubmissionMessage('')
      }

    } catch (error) {
      console.error('Error updating order status:', error)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => router.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Go Back
            </button>
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded inline-block"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Order not found</h1>
          <p className="text-gray-600 mt-2">The order you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Banner */}
      {isSuccess && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-green-900">Order Confirmed!</h2>
              <p className="text-green-700">Your payment has been processed and the KOL has been notified.</p>
            </div>
          </div>
        </div>
      )}

      {/* Order Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm border mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Order #{order.id.split('-')[0].slice(0, 8)}
            </h1>
            <p className="text-gray-600 mb-4">{order.gig.title}</p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <img
                  src={order.kol.avatar_url || 'https://images.unsplash.com/photo-1494790108755-2616b352caf1?w=150'}
                  alt={order.kol.full_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span>@{order.kol.username}</span>
              </div>
              <div>Platform: {order.gig.platform}</div>
              <div>Delivery: {order.gig.delivery_days} days</div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">${order.amount}</div>
            <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
              order.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              order.status === 'completed' ? 'bg-green-100 text-green-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {order.status.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Order Timeline */}
        <div className="lg:col-span-2">
          <OrderTimeline activities={order.activities} orderFiles={uploadedFiles} />
        </div>

        {/* Right Column - Chat & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <OrderChat orderId={order.id} sellerId={order.sellerId} />
          
          {/* Order Actions */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-4">Order Actions</h3>
            
            <div className="space-y-3">
              {/* KOL Actions */}
              {order.kol_id === user?.id && (
                <>
                  {order.status === 'paid' && (
                    <button 
                      onClick={() => updateOrderStatus('in_progress')}
                      className={`w-full ${theme.primary} ${theme.primaryHover} text-white py-2 px-4 rounded-lg font-medium`}
                    >
                      Start Working
                    </button>
                  )}
                  
                  {(order.status === 'in_progress' || order.status === 'revision') && (
                    <div className="space-y-4">
                      {/* Submit Work Section */}
                      <div>
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Submit Work:</span>
                        </div>
                        <textarea
                          value={submissionMessage}
                          onChange={(e) => setSubmissionMessage(e.target.value)}
                          placeholder="Enter your message, link, or description of the work completed (optional)..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm mb-2"
                        />
                        <button
                          onClick={() => updateOrderStatus('submitted', submissionMessage.trim() || undefined)}
                          disabled={isSubmitting}
                          className={`w-full ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : theme.primary + ' ' + theme.primaryHover} text-white py-3 px-4 rounded-lg font-semibold`}
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                      </div>

                      {/* File Upload Section */}
                      <div className="border-t pt-4">
                        <div className="flex items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Upload File (Optional)</span>
                          <span className="text-xs text-gray-500 ml-2">(MP4, Max 5MB)</span>
                        </div>
                        <input
                          type="file"
                          accept="video/mp4"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              if (file.type !== 'video/mp4') {
                                alert('Only MP4 files are allowed')
                                e.target.value = ''
                                return
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                alert('File size must be less than 5MB')
                                e.target.value = ''
                                return
                              }
                              setSelectedFile(file)
                            }
                          }}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-2"
                        />
                        {selectedFile && (
                          <>
                            <p className="text-xs text-green-600 mb-2">
                              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                            </p>
                            <textarea
                              value={uploadMessage}
                              onChange={(e) => setUploadMessage(e.target.value)}
                              placeholder="Add a message with your file..."
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm mb-2"
                            />
                            <button
                              onClick={handleFileUpload}
                              disabled={isUploading}
                              className={`w-full ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} text-white py-2 px-4 rounded-lg font-medium text-sm`}
                            >
                              {isUploading ? 'Uploading...' : 'Upload File'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {/* Sponsor Actions */}
              {order.sponsor_id === user?.id && order.status === 'submitted' && (
                <>
                  <button 
                    onClick={() => updateOrderStatus('completed')}
                    className={`w-full ${theme.primary} ${theme.primaryHover} text-white py-2 px-4 rounded-lg font-medium`}
                  >
                    Approve Work
                  </button>
                  <button 
                    onClick={() => updateOrderStatus('revision')}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg font-medium"
                  >
                    Request Revision
                  </button>
                </>
              )}
              
              
              <button className="w-full bg-red-100 hover:bg-red-200 text-red-700 py-2 px-4 rounded-lg font-medium">
                Open Dispute
              </button>
            </div>
          </div>

          {/* Order Review - Show for completed orders */}
          {order.status === 'completed' && (
            <OrderReview
              orderId={order.id}
              kolId={order.kol_id}
              kolName={order.kol?.full_name || order.kol?.username || 'KOL'}
              sponsorId={order.sponsor_id}
              orderCompletedAt={order.updated_at}
              currentUserId={user?.id}
              userType={userProfile?.user_type || 'sponsor'}
              existingReview={existingReview}
            />
          )}

          {/* Order Details */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-4">Order Details</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Date:</span>
                <span className="text-gray-900">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Date:</span>
                <span className="text-gray-900">
                  {new Date(order.deliveryDate).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Fast Delivery:</span>
                <span className="text-gray-900">{order.fastDelivery ? 'Yes' : 'No'}</span>
              </div>
              
              {order.requirements && (
                <div>
                  <span className="text-gray-600 block mb-1">Requirements:</span>
                  <p className="text-gray-900 text-xs bg-gray-50 p-2 rounded">
                    {order.requirements}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}