'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Wallet,
  Users,
  FileText,
  Settings,
  Route,
  DollarSign,
  FileImage,
  Bell,
  Send,
  ListChecks,
  UserPlus,
  Cake,
  Activity,
  ScrollText,
  ChevronDown,
  ChevronRight,
  BookOpen,
  CalendarDays,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavItem[]
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Cartera',
    icon: Wallet,
    children: [
      { title: 'Cartera Activa', href: '/cartera', icon: Wallet },
      { title: 'Cartera Muerta', href: '/cartera/muerta', icon: Wallet },
      { title: 'Limpieza', href: '/cartera/limpieza', icon: Wallet },
    ],
  },
  {
    title: 'Operaciones del Día',
    href: '/transacciones',
    icon: CalendarDays,
  },
  {
    title: 'Movimientos',
    href: '/movimientos',
    icon: BookOpen,
  },
  {
    title: 'Clientes',
    href: '/clientes',
    icon: Users,
  },
  {
    title: 'Historial Clientes',
    href: '/historial-clientes',
    icon: History,
  },
  {
    title: 'Reportes',
    icon: FileText,
    children: [
      { title: 'Financiero', href: '/reportes/financiero', icon: DollarSign },
      { title: 'Cobranza', href: '/reportes/cobranza', icon: FileText },
    ],
  },
  {
    title: 'Administrar',
    icon: Settings,
    children: [
      { title: 'Rutas', href: '/administrar/rutas', icon: Route },
      { title: 'Gastos', href: '/administrar/gastos', icon: DollarSign },
      { title: 'Cuentas', href: '/administrar/cuentas', icon: Wallet },
      { title: 'Líderes', href: '/administrar/lideres', icon: Users },
      { title: 'Nuevo Líder', href: '/administrar/lideres/nuevo', icon: UserPlus },
      { title: 'Cumpleaños', href: '/administrar/lideres/cumpleanos', icon: Cake },
    ],
  },
  {
    title: 'Documentos',
    icon: FileImage,
    children: [
      { title: 'Documentos', href: '/documentos', icon: FileImage },
      { title: 'Notificaciones', href: '/documentos/notificaciones', icon: Bell },
    ],
  },
  {
    title: 'Configuración',
    icon: Settings,
    children: [
      { title: 'Reportes', href: '/configuracion/reportes', icon: FileText },
      { title: 'Telegram Usuarios', href: '/configuracion/telegram/usuarios', icon: Send },
      { title: 'Telegram Diagnóstico', href: '/configuracion/telegram/diagnostico', icon: Activity },
      { title: 'Telegram Logs', href: '/configuracion/telegram/logs', icon: ScrollText },
    ],
  },
  {
    title: 'Listados',
    icon: ListChecks,
    children: [
      { title: 'Ver Listados', href: '/listados', icon: ListChecks },
      { title: 'Generar', href: '/listados/generar', icon: FileText },
    ],
  },
]

interface SidebarProps {
  isCollapsed?: boolean
  isMobile?: boolean
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isCollapsed = false, isMobile = false, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href?: string) => {
    if (!href) return false
    return pathname === href || pathname.startsWith(href + '/')
  }

  const isParentActive = (item: NavItem) => {
    if (item.href) return isActive(item.href)
    return item.children?.some((child) => isActive(child.href))
  }

  // On mobile: sidebar is always expanded (not collapsed), slides in/out
  // On desktop: toggle between collapsed (w-16) and expanded (w-64)
  const effectiveCollapsed = isMobile ? false : isCollapsed

  // Close sidebar when clicking a link on mobile
  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r bg-sidebar transition-all duration-300',
          effectiveCollapsed ? 'w-16' : 'w-64',
          isMobile && !isOpen && '-translate-x-full',
          isMobile && isOpen && 'translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b px-4">
          <Link href="/dashboard" className="flex items-center" onClick={handleLinkClick}>
            {effectiveCollapsed ? (
            /* Ícono pequeño cuando está colapsado */
            <div className="relative flex h-9 w-9 items-center justify-center">
              <div className="absolute inset-0 rotate-45 rounded-lg bg-primary" />
              <svg
                viewBox="0 0 24 24"
                className="relative z-10 h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M6 18L18 6" />
                <path d="M6 12L12 6" />
              </svg>
            </div>
          ) : (
              /* Logo completo cuando está expandido */
              <Image
                src="/solufacil.png"
                alt="Solufácil"
                width={150}
                height={45}
                priority
                className="h-9 w-auto"
              />
            )}
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="h-[calc(100vh-4rem)] py-4">
          <nav className="space-y-1 px-2">
            {navigation.map((item) => (
              <div key={item.title}>
                {item.children ? (
                  <div>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start gap-3',
                        isParentActive(item) && 'bg-sidebar-accent text-sidebar-accent-foreground'
                      )}
                      onClick={() => toggleExpanded(item.title)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!effectiveCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.title}</span>
                          {expandedItems.includes(item.title) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </>
                      )}
                    </Button>
                    {!effectiveCollapsed && expandedItems.includes(item.title) && (
                      <div className="ml-4 mt-1 space-y-1 border-l pl-4">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href!}
                            onClick={handleLinkClick}
                            className={cn(
                              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                              isActive(child.href) &&
                                'bg-sidebar-primary text-sidebar-primary-foreground'
                            )}
                          >
                            <child.icon className="h-4 w-4" />
                            <span>{child.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href!}
                    onClick={handleLinkClick}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive(item.href) &&
                        'bg-sidebar-primary text-sidebar-primary-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {!effectiveCollapsed && <span>{item.title}</span>}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </ScrollArea>
      </aside>
    </>
  )
}
