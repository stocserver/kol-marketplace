'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRole } from '@/contexts/RoleContext'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const { user, profile, loading } = useAuth()
  const { currentRole, switchRole, theme } = useRole()

  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
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
                    Sponsor
                  </button>
                </div>
                
                <nav className="hidden md:flex space-x-6">
                  <Link 
                    href="/marketplace" 
                    className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Browse Services
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/messages" 
                    className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.471L3 21l2.471-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                    </svg>
                    Messages
                  </Link>
                  {currentRole === 'kol' && (
                    <Link 
                      href="/gigs/create" 
                      className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Create Service
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
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}