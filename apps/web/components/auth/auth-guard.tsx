'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { saveRedirectUrl } from '@/hooks/use-redirect-url'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuth()
  const [isMounted, setIsMounted] = useState(false)
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const token = localStorage.getItem('accessToken')
    setHasToken(!!token)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const token = localStorage.getItem('accessToken')
    if (!isLoading && !isAuthenticated && !token) {
      saveRedirectUrl(pathname)
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, router, isMounted, pathname])

  // Show loading during SSR and initial mount
  if (!isMounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // If not authenticated and no token, show loading (redirect will happen)
  if (!isAuthenticated && !hasToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
