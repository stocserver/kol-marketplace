'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useRole } from '@/contexts/RoleContext'

export default function CreateGigPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    delivery_days: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { currentRole, theme } = useRole()
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Redirect if not in KOL mode
    if (currentRole !== 'kol') {
      router.push('/dashboard')
    }
  }, [currentRole, router])

  // Don't render if not in KOL mode
  if (currentRole !== 'kol') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">存取受限</h1>
          <p className="text-gray-600 mb-6">只有 KOL 才能建立服務。請切換到 KOL 模式來使用此功能。</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            返回控制面板
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const price = parseInt(formData.price)
      const delivery_days = parseInt(formData.delivery_days)

      if (price < 300 || price > 50000) {
        setError('價格必須在 NT$300 到 NT$50,000 之間')
        return
      }

      if (delivery_days < 1 || delivery_days > 30) {
        setError('交付時間必須在 1 到 30 天之間')
        return
      }

      const { error } = await supabase
        .from('gigs')
        .insert({
          kol_id: user.id,
          title: formData.title,
          description: formData.description,
          price: price,
          delivery_days: delivery_days,
          is_active: true
        })

      if (error) {
        setError(error.message)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('發生未預期的錯誤')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">建立新服務</h1>
            <p className="mt-2 text-gray-600">
              分享您的專業知識，建立您的服務項目
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                服務標題
              </label>
              <input
                type="text"
                id="title"
                required
                maxLength={100}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="我將為您的品牌制作精彩內容"
              />
              <p className="mt-1 text-sm text-gray-500">
                為您的服務撰寫一個清晰、描述性的標題
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                服務描述
              </label>
              <textarea
                id="description"
                required
                rows={6}
                maxLength={1000}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="詳細描述您的服務。您將提供什麼？您的獨特之處是什麼？請包含您的經驗和客戶可以期待的內容。"
              />
              <p className="mt-1 text-sm text-gray-500">
                提供您服務的詳細描述 ({formData.description.length}/1000 字元)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  價格 (NT$)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">NT$</span>
                  </div>
                  <input
                    type="number"
                    id="price"
                    required
                    min="300"
                    max="50000"
                    className="pl-7 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  最低 NT$300，最高 NT$50,000
                </p>
              </div>

              <div>
                <label htmlFor="delivery_days" className="block text-sm font-medium text-gray-700">
                  交付時間
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="delivery_days"
                    required
                    min="1"
                    max="30"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.delivery_days}
                    onChange={(e) => setFormData({ ...formData, delivery_days: e.target.value })}
                    placeholder="7"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">天</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  1-30 天交付時間
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-md text-sm font-medium transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`${theme.primary} ${theme.primaryHover} text-white px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? '建立中...' : '建立服務'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}