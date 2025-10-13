'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSearch } from '@/contexts/SearchContext'

export default function Home() {
  const { searchTerm, setSearchTerm } = useSearch()
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/marketplace')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
            KOL Marketplace Platform
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Professional platform connecting micro-influencers with businesses. KOL creators offer video promotion services, while businesses easily find suitable promotional partners.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search for services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-6 py-4 text-lg border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <Button type="submit" size="lg" className="text-lg px-8">
                Search
              </Button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                🌟 Become a KOL
              </CardTitle>
              <CardDescription className="text-center">
                Share your influence and earn income
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-gray-600">
                <li>• Set your service price ($300-5000)</li>
                <li>• Build your personal brand</li>
                <li>• Flexible working hours</li>
                <li>• 85% revenue share</li>
              </ul>
              <Link href="/register" className="block">
                <Button className="w-full">Start Earning</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                🏢 Business Promotion
              </CardTitle>
              <CardDescription className="text-center">
                Find the perfect KOL promotional partner
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-gray-600">
                <li>• Browse various promotional services</li>
                <li>• Transparent pricing and delivery times</li>
                <li>• Secure payment protection</li>
                <li>• Professional service quality</li>
              </ul>
              <Link href="/marketplace" className="block">
                <Button variant="outline" className="w-full">
                  Explore Services
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                1
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Create Account</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Choose KOL or business identity</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                2
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Browse Services</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Find suitable promotional services</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                3
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Complete Transaction</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Secure payment with quality guarantee</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
