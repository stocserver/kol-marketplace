'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRole } from '@/contexts/RoleContext'
import { useAuth, triggerAuthRefresh } from '@/hooks/useAuth'

export default function Header() {
  const { user, profile, loading } = useAuth()
  const { currentRole, switchRole, theme } = useRole()

  const handleSignOut = async () => {
    // Clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase')) {
        localStorage.removeItem(key)
      }
    })
    
    // Clear cookies
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=')
      if (name.includes('supabase') || name.includes('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      }
    })
    
    // Trigger auth refresh
    triggerAuthRefresh()
    
    // Redirect to home
    window.location.href = '/'
  }

  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-gray-900">
                KOL Marketplace
              </Link>
            </div>
            <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className={`bg-gradient-to-r ${theme.gradient} shadow-sm border-b`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4 sm:space-x-6 lg:space-x-8">
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-white">
                KOL Marketplace
              </Link>
            </div>
            
            {user && (
              <>
                {/* Role Switch Toggle */}
                <div className="hidden sm:flex items-center space-x-2 bg-white/10 rounded-lg p-1">
                  <button
                    onClick={() => switchRole('kol')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      currentRole === 'kol'
                        ? 'bg-white text-purple-600'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    KOL
                  </button>
                  <button
                    onClick={() => switchRole('sponsor')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      currentRole === 'sponsor'
                        ? 'bg-white text-blue-600'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    商家
                  </button>
                </div>
                
                <nav className="hidden md:flex space-x-6">
                  <Link 
                    href="/marketplace" 
                    className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    瀏覽服務
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    控制面板
                  </Link>
                  {currentRole === 'kol' && (
                    <Link 
                      href="/gigs/create" 
                      className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      建立服務
                    </Link>
                  )}
                </nav>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {user ? (
              <>
                <div className="hidden sm:flex items-center space-x-3">
                  {profile && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {profile.full_name}
                      </div>
                      <div className="text-xs text-white/70 capitalize">
                        @{profile.username}
                      </div>
                    </div>
                  )}
                  
                  <div className="relative">
                    {profile?.avatar_url ? (
                      <Image
                        className="h-8 w-8 rounded-full border-2 border-white/20"
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/20">
                        <span className="text-sm font-medium text-white">
                          {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <Link
                    href="/profile"
                    className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    個人資料
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    登出
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  登入
                </Link>
                <Link
                  href="/login"
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  註冊
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}