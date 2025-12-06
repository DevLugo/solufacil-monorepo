'use client'

import * as React from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { AuthGuard } from '@/components/auth/auth-guard'
import { cn } from '@/lib/utils'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Sidebar */}
        <Sidebar isCollapsed={sidebarCollapsed} />

        {/* Header */}
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Main content */}
        <main
          className={cn(
            'min-h-screen pt-16 transition-all duration-300',
            sidebarCollapsed ? 'pl-16' : 'pl-64'
          )}
        >
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </AuthGuard>
  )
}
