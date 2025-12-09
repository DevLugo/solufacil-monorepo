'use client'

import { User, MapPin, Phone, RefreshCw } from 'lucide-react'
import { CommandItem } from '@/components/ui/command'
import { ClientLoanBadges } from './ClientLoanBadges'
import type { UnifiedClientValue } from '../../types'

interface ClientSearchItemProps {
  client: UnifiedClientValue
  mode: 'borrower' | 'aval'
  variant: 'current-location' | 'other-location' | 'active-loan'
  onSelect: (client: UnifiedClientValue) => void
}

export function ClientSearchItem({ client, mode, variant, onSelect }: ClientSearchItemProps) {
  const getIcon = () => {
    if (variant === 'active-loan') {
      return (
        <div className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 flex-shrink-0">
          <RefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
      )
    }
    if (variant === 'other-location') {
      return (
        <div className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 flex-shrink-0">
          <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
      )
    }
    return (
      <div className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0">
        <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
      </div>
    )
  }

  const getSubtitle = () => {
    if (variant === 'other-location') {
      return (
        <div className="text-sm text-amber-600 dark:text-amber-400 mt-1">
          {client.locationName || 'Otra localidad'}
        </div>
      )
    }
    return (
      <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
        <Phone className="h-3.5 w-3.5" />
        <span>{client.phone || 'Sin teléfono'}</span>
      </div>
    )
  }

  return (
    <CommandItem
      key={client.id}
      value={client.id}
      onSelect={() => onSelect(client)}
      className="flex items-start gap-3 py-3 md:py-4 px-3 cursor-pointer data-[selected=true]:bg-muted touch-manipulation"
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate text-foreground text-base">{client.fullName}</div>
        {getSubtitle()}
      </div>
      <div className="flex-shrink-0">
        <ClientLoanBadges client={client} mode={mode} />
      </div>
    </CommandItem>
  )
}
