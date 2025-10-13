"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function OrderSuccessRedirect() {
  const router = useRouter()
  const search = useSearchParams()

  useEffect(() => {
    const pid = search.get('payment_intent')
    if (!pid) {
      router.replace('/dashboard')
      return
    }

    const go = async () => {
      try {
        const res = await fetch(`/api/orders/by-payment-intent?pid=${encodeURIComponent(pid)}`, { cache: 'no-store' })
        const json = await res.json()
        if (res.ok && json.orderId) {
          router.replace(`/orders/${json.orderId}?success=true`)
        } else {
          router.replace('/dashboard')
        }
      } catch {
        router.replace('/dashboard')
      }
    }

    go()
  }, [router, search])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-gray-700">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
        <p>Finalizing your order...</p>
      </div>
    </div>
  )
}

