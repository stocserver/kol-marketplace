import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            台灣 KOL 推廣平台
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            連接微網紅與商家的專業平台。KOL 提供影片推廣服務，商家輕鬆找到合適的推廣夥伴。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-sm sm:max-w-none mx-auto">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                立即註冊
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                登入
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                🌟 成為 KOL
              </CardTitle>
              <CardDescription className="text-center">
                分享您的影響力，賺取收入
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-gray-600">
                <li>• 設定您的服務價格 (NT$300-5000)</li>
                <li>• 建立個人品牌形象</li>
                <li>• 彈性工作時間</li>
                <li>• 85% 收益分成</li>
              </ul>
              <Link href="/register" className="block">
                <Button className="w-full">開始賺錢</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                🏢 商家推廣
              </CardTitle>
              <CardDescription className="text-center">
                找到完美的 KOL 推廣夥伴
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-gray-600">
                <li>• 瀏覽各種推廣服務</li>
                <li>• 透明的價格和交付時間</li>
                <li>• 安全的付款保障</li>
                <li>• 專業的服務品質</li>
              </ul>
              <Link href="/marketplace" className="block">
                <Button variant="outline" className="w-full">
                  探索服務
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
            如何運作
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                1
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">註冊帳戶</h3>
              <p className="text-gray-600 text-xs sm:text-sm">選擇 KOL 或商家身份</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                2
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">瀏覽服務</h3>
              <p className="text-gray-600 text-xs sm:text-sm">找到合適的推廣服務</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                3
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">完成交易</h3>
              <p className="text-gray-600 text-xs sm:text-sm">安全付款，品質保證</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
