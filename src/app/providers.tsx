'use client'

import { RoleProvider } from "@/contexts/RoleContext"
import { SearchProvider } from "@/contexts/SearchContext"
import Header from "@/components/Header"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <SearchProvider>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
      </SearchProvider>
    </RoleProvider>
  )
}
