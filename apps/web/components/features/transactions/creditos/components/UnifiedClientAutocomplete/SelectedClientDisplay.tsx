'use client'

import { User, MapPin, Phone, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { UnifiedClientValue } from '../../types'

interface SelectedClientDisplayProps {
  value: UnifiedClientValue
  allowEdit: boolean
  disabled: boolean
  onStartEdit: () => void
  onClear: () => void
  className?: string
}

function getStateStyles(value: UnifiedClientValue): string {
  switch (value.clientState) {
    case 'newClient':
      return 'border-blue-300 bg-blue-50/30 dark:border-blue-700 dark:bg-blue-950/20'
    case 'edited':
      return 'border-emerald-300 bg-emerald-50/30 dark:border-emerald-700 dark:bg-emerald-950/20'
    case 'renewed':
      return 'border-green-300 bg-green-50/30 dark:border-green-700 dark:bg-green-950/20'
    default:
      if (!value.isFromCurrentLocation) {
        return 'border-orange-300 bg-orange-50/30 dark:border-orange-700 dark:bg-orange-950/20'
      }
      return 'border-input bg-muted/30'
  }
}

export function SelectedClientDisplay({
  value,
  allowEdit,
  disabled,
  onStartEdit,
  onClear,
  className,
}: SelectedClientDisplayProps) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 p-2.5 md:p-3 border rounded-lg transition-colors touch-manipulation',
      getStateStyles(value),
      className
    )}>
      {/* Avatar/Icon */}
      <div className={cn(
        'flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full flex-shrink-0',
        value.clientState === 'newClient' && 'bg-blue-100 dark:bg-blue-900/50',
        value.clientState === 'edited' && 'bg-emerald-100 dark:bg-emerald-900/50',
        value.clientState === 'renewed' && 'bg-green-100 dark:bg-green-900/50',
        !value.isFromCurrentLocation && value.clientState === 'existing' && 'bg-orange-100 dark:bg-orange-900/50',
        value.isFromCurrentLocation && value.clientState === 'existing' && 'bg-muted',
      )}>
        {!value.isFromCurrentLocation && value.clientState === 'existing' ? (
          <MapPin className="h-4 w-4 md:h-5 md:w-5 text-orange-600 dark:text-orange-400" />
        ) : (
          <User className={cn(
            'h-4 w-4 md:h-5 md:w-5',
            value.clientState === 'newClient' && 'text-blue-600 dark:text-blue-400',
            value.clientState === 'edited' && 'text-emerald-600 dark:text-emerald-400',
            value.clientState === 'renewed' && 'text-green-600 dark:text-green-400',
            value.clientState === 'existing' && 'text-muted-foreground',
          )} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-sm md:text-base truncate">{value.fullName}</span>
          {value.clientState === 'newClient' && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              Nuevo
            </Badge>
          )}
          {value.clientState === 'edited' && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              Editado
            </Badge>
          )}
          {value.clientState === 'renewed' && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
              Renovación
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mt-0.5">
          {value.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {value.phone}
            </span>
          )}
          {!value.isFromCurrentLocation && value.locationName && (
            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <MapPin className="h-3 w-3" />
              {value.locationName}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {allowEdit && value.clientState !== 'renewed' && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-foreground"
            onClick={onStartEdit}
            disabled={disabled}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onClear}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
