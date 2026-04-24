'use client'

import { useState } from 'react'
import Image from 'next/image'
import AppSidebar, { MobileMenuButton } from '@/components/AppSidebar'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { PageLoadingSpinner } from '@/components/ui/loading-spinner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isGuardLoading, handleLogout } = useAuthGuard()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  if (isGuardLoading) return <PageLoadingSpinner />

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA]">
      <AppSidebar
        user={user}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-[#E0E0E0] flex-shrink-0">
          <MobileMenuButton onClick={() => setMobileSidebarOpen(true)} />
          <Image src="/HEROICA.svg" alt="Heroica" width={80} height={32} className="h-7 w-auto" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
