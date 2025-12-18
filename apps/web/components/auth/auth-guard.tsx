'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { saveRedirectUrl } from '@/hooks/use-redirect-url'
import { tieneAcceso } from '@/lib/permissions'
import { UserRoleType } from '@solufacil/shared'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading, user } = useAuth()
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

  // Verificar permisos de ruta despues de autenticacion
  useEffect(() => {
    if (!isMounted || isLoading || !isAuthenticated || !user) return

    const rolUsuario = user.role as UserRoleType
    if (!tieneAcceso(rolUsuario, pathname)) {
      // Redirigir a dashboard si no tiene permiso
      router.replace('/dashboard')
    }
  }, [isMounted, isLoading, isAuthenticated, user, pathname, router])

  // Mostrar carga durante SSR y montaje inicial
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

  // Si no esta autenticado y no hay token, mostrar carga (redirect ocurrira)
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
