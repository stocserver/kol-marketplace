'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRole } from '@/contexts/RoleContext'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const { user, profile, loading } = useAuth()
  const { currentRole, switchRole, theme } = useRole()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const closeDropdown = () => setDropdownOpen(false)

  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Sponsor X
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
                Sponsor X
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
                  {/* Admin Link - only show for admin users */}
                  {user?.email === 'admin@kolmarketplace.com' || user?.email?.endsWith('@admin.com') || user?.email === 'ivn.c.yu@gmail.com' ? (
                    <Link 
                      href="/admin" 
                      className="text-yellow-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
                      title="Admin Panel"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Admin
                    </Link>
                  ) : null}
                </nav>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {user ? (
              <div className="relative">
                {/* User Avatar/Name Button */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-3 text-white hover:text-white/80 transition-colors focus:outline-none"
                >
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-medium text-white">
                      {profile?.full_name || 'User'}
                    </div>
                    <div className="text-xs text-white/70 capitalize">
                      @{profile?.username || 'username'}
                    </div>
                  </div>
                  
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
                    
                    {/* Dropdown Arrow */}
                    <svg 
                      className={`w-3 h-3 text-white/60 absolute -bottom-1 -right-1 transition-transform ${
                        dropdownOpen ? 'rotate-180' : ''
                      }`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={closeDropdown}
                    ></div>
                    
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="text-sm font-medium text-gray-900">
                          {profile?.full_name || 'User'}
                        </div>
                        <div className="text-xs text-gray-500">
                          @{profile?.username || 'username'}
                        </div>
                      </div>

                      {/* Menu Items */}
                      <Link
                        href="/profile"
                        onClick={closeDropdown}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Edit Profile
                      </Link>

                      <Link
                        href="/favorites"
                        onClick={closeDropdown}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Favorites
                      </Link>

                      {currentRole === 'kol' && (
                        <Link
                          href="/gigs/create"
                          onClick={closeDropdown}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create Service
                        </Link>
                      )}

                      <Link
                        href="/gigs"
                        onClick={closeDropdown}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        {currentRole === 'kol' ? 'My Services' : 'My Orders'}
                      </Link>

                      <div className="border-t border-gray-100"></div>
                      
                      <button
                        onClick={() => {
                          handleSignOut()
                          closeDropdown()
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
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