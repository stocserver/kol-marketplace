'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Role = 'kol' | 'sponsor'

interface RoleContextType {
  currentRole: Role
  switchRole: (role: Role) => void
  theme: {
    primary: string
    primaryHover: string
    accent: string
    gradient: string
    text: string
  }
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

const themes = {
  kol: {
    primary: 'bg-purple-600',
    primaryHover: 'hover:bg-purple-700',
    accent: 'bg-purple-100 text-purple-800',
    gradient: 'from-purple-600 to-pink-600',
    text: 'text-purple-600'
  },
  sponsor: {
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    accent: 'bg-blue-100 text-blue-800',
    gradient: 'from-blue-600 to-cyan-600',
    text: 'text-blue-600'
  }
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>('kol')

  useEffect(() => {
    // Load saved role from localStorage
    const savedRole = localStorage.getItem('currentRole') as Role
    if (savedRole && (savedRole === 'kol' || savedRole === 'sponsor')) {
      setCurrentRole(savedRole)
    }
  }, [])

  const switchRole = (role: Role) => {
    setCurrentRole(role)
    localStorage.setItem('currentRole', role)
  }

  const theme = themes[currentRole]

  return (
    <RoleContext.Provider value={{ currentRole, switchRole, theme }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}