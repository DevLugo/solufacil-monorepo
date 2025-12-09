'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useLazyQuery, useMutation } from '@apollo/client'
import {
  Check,
  ChevronsUpDown,
  MapPin,
  User,
  Plus,
  X,
  Pencil,
  Phone,
  UserPlus,
  AlertCircle,
  DollarSign,
  History,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import { SEARCH_BORROWERS_QUERY, SEARCH_PERSONAL_DATA_QUERY } from '@/graphql/queries/transactions'
import { UPDATE_PHONE } from '@/graphql/mutations/transactions'
import { gql } from '@apollo/client'
import type { BorrowerSearchResult, PersonalData, UnifiedClientValue, PreviousLoan, ActiveLoanData } from '../types'

// Mutation para actualizar borrower (nombre)
const UPDATE_BORROWER_MUTATION = gql`
  mutation UpdateBorrower($id: ID!, $input: UpdateBorrowerInput!) {
    updateBorrower(id: $id, input: $input) {
      id
      personalData {
        id
        fullName
        phones {
          id
          number
        }
      }
    }
  }
`

// Mutation para actualizar PersonalData directamente (para avales)
const UPDATE_PERSONAL_DATA_MUTATION = gql`
  mutation UpdatePersonalData($id: ID!, $fullName: String!) {
    updatePersonalData(id: $id, fullName: $fullName) {
      id
      fullName
      phones {
        id
        number
      }
    }
  }
`

// Re-export types for convenience
export type { ClientState, ClientAction, UnifiedClientValue } from '../types'

// Extended value type to track personalDataId for mutations
interface UnifiedClientValueExtended extends UnifiedClientValue {
  personalDataId?: string
  phoneId?: string
}

interface UnifiedClientAutocompleteProps {
  mode: 'borrower' | 'aval'
  value?: UnifiedClientValueExtended | null
  onValueChange: (value: UnifiedClientValueExtended | null) => void
  // For borrower mode
  leadId?: string
  // For aval mode - exclude borrower from results
  excludeBorrowerId?: string
  // Location for prioritization and warnings
  locationId?: string | null
  // Active loans for renewal - shows loan info in dropdown
  activeLoansForRenewal?: PreviousLoan[]
  placeholder?: string
  disabled?: boolean
  // Allow creating new clients
  allowCreate?: boolean
  // Show inline editing
  allowEdit?: boolean
  className?: string
}

export function UnifiedClientAutocomplete({
  mode,
  value,
  onValueChange,
  leadId,
  excludeBorrowerId,
  locationId,
  activeLoansForRenewal = [],
  placeholder,
  disabled = false,
  allowCreate = true,
  allowEdit = true,
  className,
}: UnifiedClientAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [isEditSaving, setIsEditSaving] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // Mutations for real-time editing
  const [updateBorrower] = useMutation(UPDATE_BORROWER_MUTATION)
  const [updatePersonalData] = useMutation(UPDATE_PERSONAL_DATA_MUTATION)
  const [updatePhone] = useMutation(UPDATE_PHONE)

  // Attach wheel event listener to enable mouse/trackpad scrolling in the dropdown
  // This is needed because cmdk captures events and can interfere with scrolling
  useEffect(() => {
    const container = listRef.current
    if (!container || !open) return

    const handleWheel = (e: WheelEvent) => {
      // Allow the scroll to happen naturally by not preventing default
      // Just stop propagation so cmdk doesn't interfere
      e.stopPropagation()
      container.scrollTop += e.deltaY
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [open])

  const defaultPlaceholder = mode === 'borrower' ? 'Buscar cliente...' : 'Buscar aval...'

  // Use appropriate query based on mode
  const [searchBorrowers, { data: borrowerData, loading: borrowerLoading }] = useLazyQuery(
    SEARCH_BORROWERS_QUERY,
    { fetchPolicy: 'network-only' }
  )

  const [searchPersonalData, { data: personalDataData, loading: personalDataLoading }] = useLazyQuery(
    SEARCH_PERSONAL_DATA_QUERY,
    { fetchPolicy: 'network-only' }
  )

  const loading = mode === 'borrower' ? borrowerLoading : personalDataLoading

  // Create lookup map of active loans by borrower ID
  const activeLoansByBorrowerId = useMemo(() => {
    const map = new Map<string, PreviousLoan>()
    if (mode === 'borrower' && activeLoansForRenewal.length > 0) {
      for (const loan of activeLoansForRenewal) {
        // Only keep the latest loan per borrower (loans should be sorted by date)
        if (!map.has(loan.borrower.id)) {
          map.set(loan.borrower.id, loan)
        }
      }
    }
    return map
  }, [activeLoansForRenewal, mode])

  // Default options: clients with active loans (for showing before search)
  const defaultActiveLoansOptions = useMemo((): UnifiedClientValue[] => {
    if (mode !== 'borrower' || activeLoansForRenewal.length === 0) return []

    // Get unique borrowers from active loans
    const uniqueBorrowers = new Map<string, PreviousLoan>()
    for (const loan of activeLoansForRenewal) {
      if (!uniqueBorrowers.has(loan.borrower.id)) {
        uniqueBorrowers.set(loan.borrower.id, loan)
      }
    }

    return Array.from(uniqueBorrowers.values()).map((loan): UnifiedClientValue => {
      const leadLocation = loan.lead?.personalData?.addresses?.[0]?.location
      const borrowerLocation = loan.borrower.personalData?.addresses?.[0]?.location

      return {
        id: loan.borrower.id,
        fullName: loan.borrower.personalData?.fullName || 'Sin nombre',
        phone: loan.borrower.personalData?.phones?.[0]?.number,
        locationId: borrowerLocation?.id,
        locationName: borrowerLocation?.name,
        isFromCurrentLocation: locationId ? borrowerLocation?.id === locationId : true,
        loanFinishedCount: loan.borrower.loanFinishedCount,
        hasActiveLoans: true,
        pendingDebtAmount: parseFloat(loan.pendingAmountStored || '0'),
        activeLoan: {
          id: loan.id,
          requestedAmount: loan.requestedAmount,
          amountGived: loan.amountGived,
          pendingAmountStored: loan.pendingAmountStored,
          expectedWeeklyPayment: loan.expectedWeeklyPayment,
          totalPaid: loan.totalPaid,
          loantype: loan.loantype,
          collaterals: loan.collaterals,
          leadLocationName: leadLocation?.name,
        },
        clientState: 'existing',
        action: 'connect',
      }
    })
  }, [activeLoansForRenewal, mode, locationId])

  // Debounce search - searches ALL locations and ALL clients
  // locationId is only used to mark isFromCurrentLocation and prioritize results
  // leadId is NOT passed to search all borrowers, not just those with active loans from this lead
  useEffect(() => {
    if (searchTerm.length < 2) return

    const timer = setTimeout(() => {
      if (mode === 'borrower') {
        searchBorrowers({
          variables: {
            searchTerm,
            // Don't pass leadId - we want to search ALL borrowers, not just those with loans from this lead
            // Pass locationId only to mark isFromCurrentLocation and prioritize results
            locationId,
            limit: 20,
          },
        })
      } else {
        searchPersonalData({
          variables: {
            searchTerm,
            excludeBorrowerId,
            // Pass locationId only to mark isFromCurrentLocation and prioritize results
            locationId,
            limit: 20,
          },
        })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, searchBorrowers, searchPersonalData, locationId, excludeBorrowerId, mode])

  // Transform results to unified format
  const results = useMemo(() => {
    if (mode === 'borrower') {
      const borrowers: BorrowerSearchResult[] = borrowerData?.searchBorrowers || []
      return borrowers.map((b): UnifiedClientValueExtended => {
        // Check if borrower has an active loan
        const activeLoan = activeLoansByBorrowerId.get(b.id)
        let activeLoanData: ActiveLoanData | undefined

        if (activeLoan) {
          const leadLocation = activeLoan.lead?.personalData?.addresses?.[0]?.location
          activeLoanData = {
            id: activeLoan.id,
            requestedAmount: activeLoan.requestedAmount,
            amountGived: activeLoan.amountGived,
            pendingAmountStored: activeLoan.pendingAmountStored,
            expectedWeeklyPayment: activeLoan.expectedWeeklyPayment,
            totalPaid: activeLoan.totalPaid,
            loantype: activeLoan.loantype,
            collaterals: activeLoan.collaterals,
            leadLocationName: leadLocation?.name,
          }
        }

        // Get location name - prefer direct field, fallback to address data
        const borrowerLocationName = b.locationName || b.personalData?.addresses?.[0]?.location?.name
        const borrowerLocationId = b.locationId || b.personalData?.addresses?.[0]?.location?.id

        return {
          id: b.id,
          personalDataId: b.personalData.id, // Track for mutations
          phoneId: b.personalData.phones[0]?.id, // Track for mutations
          fullName: b.personalData.fullName,
          phone: b.personalData.phones[0]?.number,
          locationId: borrowerLocationId,
          locationName: borrowerLocationName,
          isFromCurrentLocation: b.isFromCurrentLocation,
          loanFinishedCount: b.loanFinishedCount,
          hasActiveLoans: b.hasActiveLoans || !!activeLoan,
          pendingDebtAmount: activeLoan
            ? parseFloat(activeLoan.pendingAmountStored || '0')
            : b.pendingDebtAmount ? parseFloat(b.pendingDebtAmount) : undefined,
          activeLoan: activeLoanData,
          clientState: 'existing',
          action: 'connect',
        }
      })
    } else {
      const personalData: PersonalData[] = personalDataData?.searchPersonalData || []
      return personalData.map((p): UnifiedClientValueExtended => {
        const personLocationId = p.addresses?.[0]?.location?.id
        const personLocationName = p.addresses?.[0]?.location?.name
        return {
          id: p.id,
          personalDataId: p.id, // For avales, id IS the personalDataId
          phoneId: p.phones[0]?.id, // Track for mutations
          fullName: p.fullName,
          phone: p.phones[0]?.number,
          locationId: personLocationId,
          locationName: personLocationName,
          isFromCurrentLocation: locationId ? personLocationId === locationId : true,
          clientState: 'existing',
          action: 'connect',
        }
      })
    }
  }, [mode, borrowerData, personalDataData, locationId, activeLoansByBorrowerId])

  // Helper function to render client loan info (for dropdown items)
  const renderClientLoanInfo = (client: UnifiedClientValue) => {
    if (mode !== 'borrower') return null

    // Client has an active loan - show detailed info
    if (client.activeLoan) {
      const pendingAmount = parseFloat(client.activeLoan.pendingAmountStored || '0')
      const hasDebt = pendingAmount > 0
      return (
        <div className="flex flex-col items-end gap-0.5">
          {/* Location badge */}
          {client.activeLoan.leadLocationName && (
            <Badge variant="outline" className="text-xs font-normal gap-1">
              <MapPin className="h-2.5 w-2.5" />
              {client.activeLoan.leadLocationName}
            </Badge>
          )}
          {/* Debt badge */}
          <Badge
            variant={hasDebt ? 'destructive' : 'outline'}
            className={cn(
              'text-xs font-normal gap-1',
              !hasDebt && 'text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30'
            )}
          >
            <DollarSign className="h-2.5 w-2.5" />
            {hasDebt ? `Debe: ${formatCurrency(pendingAmount)}` : 'Sin deuda'}
          </Badge>
        </div>
      )
    }

    // Has active loan but no detailed data (fallback)
    if (client.hasActiveLoans) {
      return (
        <div className="flex flex-col items-end gap-0.5">
          {/* Show client's location if available */}
          {client.locationName && (
            <Badge variant="outline" className="text-xs font-normal gap-1">
              <MapPin className="h-2.5 w-2.5" />
              {client.locationName}
            </Badge>
          )}
          {/* Debt badge */}
          {client.pendingDebtAmount && client.pendingDebtAmount > 0 ? (
            <Badge variant="destructive" className="text-xs font-normal gap-1">
              <DollarSign className="h-2.5 w-2.5" />
              Debe: {formatCurrency(client.pendingDebtAmount)}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs font-normal text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30 gap-1">
              <DollarSign className="h-2.5 w-2.5" />
              Sin deuda
            </Badge>
          )}
        </div>
      )
    }

    // Has completed loans but no active ones
    if (client.loanFinishedCount && client.loanFinishedCount > 0) {
      return (
        <Badge variant="outline" className="text-xs font-normal text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
          <History className="h-3 w-3 mr-1" />
          {client.loanFinishedCount} completados
        </Badge>
      )
    }

    // New client (no loans)
    return (
      <Badge variant="secondary" className="text-xs font-normal">
        Sin historial
      </Badge>
    )
  }

  // Separate by location
  const fromCurrentLocation = results.filter((r) => r.isFromCurrentLocation)
  const fromOtherLocations = results.filter((r) => !r.isFromCurrentLocation)

  // Handle selecting existing client
  const handleSelect = useCallback(
    (client: UnifiedClientValueExtended) => {
      onValueChange({
        ...client,
        originalFullName: client.fullName,
        originalPhone: client.phone,
        clientState: 'existing',
        action: 'connect',
      })
      setOpen(false)
      setSearchTerm('')
      setIsCreatingNew(false)
    },
    [onValueChange]
  )

  // Handle creating new client
  const handleCreateNew = useCallback(() => {
    setIsCreatingNew(true)
    setNewClientName(searchTerm)
    setNewClientPhone('')
    setOpen(false)
  }, [searchTerm])

  // Confirm new client creation
  const handleConfirmNewClient = useCallback(() => {
    if (!newClientName.trim()) return

    onValueChange({
      fullName: newClientName.trim(),
      phone: newClientPhone.trim() || undefined,
      isFromCurrentLocation: true,
      locationId: locationId || undefined,
      clientState: 'newClient',
      action: 'create',
    })
    setIsCreatingNew(false)
    setNewClientName('')
    setNewClientPhone('')
  }, [newClientName, newClientPhone, locationId, onValueChange])

  // Cancel new client creation
  const handleCancelNewClient = useCallback(() => {
    setIsCreatingNew(false)
    setNewClientName('')
    setNewClientPhone('')
  }, [])

  // Start editing
  const handleStartEdit = useCallback(() => {
    if (value) {
      setEditName(value.fullName)
      setEditPhone(value.phone || '')
      setIsEditing(true)
    }
  }, [value])

  // Confirm edit with real-time mutation
  const handleConfirmEdit = useCallback(async () => {
    if (!value || !editName.trim()) return

    const nameChanged = editName.trim().toUpperCase() !== (value.originalFullName || '').toUpperCase()
    const phoneChanged = editPhone.trim() !== (value.originalPhone || '')
    const hasChanges = nameChanged || phoneChanged

    // If no changes, just close
    if (!hasChanges) {
      setIsEditing(false)
      return
    }

    // For existing clients, make real-time mutations
    if (value.id && value.clientState !== 'newClient') {
      setIsEditSaving(true)
      try {
        // Update name based on mode
        if (nameChanged) {
          if (mode === 'borrower') {
            // For borrowers, use updateBorrower which updates the personalData name
            await updateBorrower({
              variables: {
                id: value.id,
                input: {
                  personalData: {
                    fullName: editName.trim().toUpperCase(),
                  },
                },
              },
            })
          } else {
            // For avales, update PersonalData directly
            await updatePersonalData({
              variables: {
                id: value.id, // In aval mode, id IS the personalDataId
                fullName: editName.trim().toUpperCase(),
              },
            })
          }
        }

        // Update phone if changed
        if (phoneChanged && value.personalDataId) {
          await updatePhone({
            variables: {
              input: {
                personalDataId: value.personalDataId,
                phoneId: value.phoneId || null,
                number: editPhone.trim(),
              },
            },
          })
        }

        // Update local state with new values
        onValueChange({
          ...value,
          fullName: editName.trim().toUpperCase(),
          phone: editPhone.trim() || undefined,
          originalFullName: editName.trim().toUpperCase(),
          originalPhone: editPhone.trim() || undefined,
          clientState: 'edited',
          action: 'connect', // Already updated in DB, just connect
        })
      } catch (error) {
        console.error('Error updating client:', error)
        alert('Error al actualizar la información del cliente')
      } finally {
        setIsEditSaving(false)
      }
    } else {
      // For new clients (not yet in DB), just update local state
      onValueChange({
        ...value,
        fullName: editName.trim().toUpperCase(),
        phone: editPhone.trim() || undefined,
        clientState: value.clientState === 'newClient' ? 'newClient' : 'edited',
        action: value.clientState === 'newClient' ? 'create' : 'update',
      })
    }

    setIsEditing(false)
  }, [value, editName, editPhone, onValueChange, mode, updateBorrower, updatePersonalData, updatePhone])

  // Cancel edit
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false)
    setEditName('')
    setEditPhone('')
  }, [])

  // Clear selection
  const handleClear = useCallback(() => {
    onValueChange(null)
    setIsCreatingNew(false)
    setIsEditing(false)
  }, [onValueChange])

  // Determine visual state for selected value - using subtle, professional colors
  const getStateStyles = () => {
    if (!value) return 'border-input'

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

  // Render new client creation form
  if (isCreatingNew) {
    return (
      <div className={cn('space-y-4 p-4 md:p-5 border-2 rounded-lg border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 touch-manipulation', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <UserPlus className="h-5 w-5" />
            </div>
            <span className="font-semibold text-base md:text-lg">
              Nuevo {mode === 'borrower' ? 'cliente' : 'aval'}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 md:h-11 md:w-11 text-muted-foreground hover:text-foreground"
            onClick={handleCancelNewClient}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-sm md:text-base font-medium">Nombre completo</Label>
            <Input
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="Ej: Juan Pérez García"
              className="mt-1.5 h-11 md:h-12 text-base"
              autoFocus
            />
          </div>
          <div>
            <Label className="text-sm md:text-base font-medium">Teléfono (opcional)</Label>
            <Input
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
              placeholder="Ej: 5512345678"
              inputMode="tel"
              className="mt-1.5 h-11 md:h-12 text-base"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelNewClient}
            className="flex-1 h-11 md:h-12 text-base"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmNewClient}
            disabled={!newClientName.trim()}
            className="flex-1 h-11 md:h-12 text-base bg-blue-600 hover:bg-blue-700"
          >
            <Check className="h-5 w-5 mr-2" />
            Confirmar
          </Button>
        </div>
      </div>
    )
  }

  // Render editing form
  if (isEditing && value) {
    return (
      <div className={cn('space-y-3 p-3 md:p-4 border rounded-lg bg-muted/50 touch-manipulation', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Pencil className="h-4 w-4" />
            <span className="text-sm font-medium">
              Editando {mode === 'borrower' ? 'cliente' : 'aval'}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleCancelEdit}
            disabled={isEditSaving}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="text-xs text-muted-foreground">Nombre completo</Label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value.toUpperCase())}
              placeholder="Nombre"
              className="mt-1 h-10 text-sm"
              autoFocus
              disabled={isEditSaving}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Teléfono</Label>
            <Input
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="Teléfono"
              inputMode="tel"
              className="mt-1 h-10 text-sm"
              disabled={isEditSaving}
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancelEdit}
            disabled={isEditSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirmEdit}
            disabled={!editName.trim() || isEditSaving}
          >
            {isEditSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-1.5" />
                Guardar
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Render selected value display
  if (value) {
    return (
      <div className={cn(
        'flex items-center gap-2.5 p-2.5 md:p-3 border rounded-lg transition-colors touch-manipulation',
        getStateStyles(),
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
              onClick={handleStartEdit}
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
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // Render search popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between h-11 md:h-12 px-3 md:px-4 font-normal text-base touch-manipulation',
            className
          )}
          disabled={disabled}
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <User className="h-5 w-5" />
            {placeholder || defaultPlaceholder}
          </span>
          <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={{ width: 'var(--radix-popover-trigger-width)', minWidth: '340px' }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Escribe para buscar..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="h-12 text-base"
          />
          <CommandList
            ref={listRef}
            className="max-h-[50vh] md:max-h-[60vh] overflow-y-auto overscroll-contain"
          >
            {loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Buscando...
              </div>
            )}

            {!loading && searchTerm.length >= 2 && results.length === 0 && (
              <CommandEmpty>
                <div className="flex flex-col items-center gap-3 py-6">
                  <span className="text-base">No se encontraron resultados</span>
                  {allowCreate && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCreateNew}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50 h-11 md:h-12 px-4 text-base touch-manipulation"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Crear nuevo {mode === 'borrower' ? 'cliente' : 'aval'}
                    </Button>
                  )}
                </div>
              </CommandEmpty>
            )}

            {!loading && searchTerm.length < 2 && defaultActiveLoansOptions.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Escribe al menos 2 caracteres
              </div>
            )}

            {/* Show default active loans when no search term */}
            {!loading && searchTerm.length < 2 && defaultActiveLoansOptions.length > 0 && (
              <CommandGroup heading="Clientes con préstamo activo">
                {defaultActiveLoansOptions.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={() => handleSelect(client)}
                    className="flex items-start gap-3 py-3 md:py-4 px-3 cursor-pointer data-[selected=true]:bg-muted touch-manipulation"
                  >
                    <div className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 flex-shrink-0">
                      <RefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-foreground text-base">{client.fullName}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{client.phone || 'Sin teléfono'}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {renderClientLoanInfo(client)}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {fromCurrentLocation.length > 0 && (
              <CommandGroup heading="De esta localidad">
                {fromCurrentLocation.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={() => handleSelect(client)}
                    className="flex items-start gap-3 py-3 md:py-4 px-3 cursor-pointer data-[selected=true]:bg-muted touch-manipulation"
                  >
                    <div className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                      <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-foreground text-base">{client.fullName}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{client.phone || 'Sin teléfono'}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {renderClientLoanInfo(client)}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {fromCurrentLocation.length > 0 && fromOtherLocations.length > 0 && (
              <CommandSeparator />
            )}

            {fromOtherLocations.length > 0 && (
              <CommandGroup heading="Otras localidades">
                {fromOtherLocations.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={() => handleSelect(client)}
                    className="flex items-start gap-3 py-3 md:py-4 px-3 cursor-pointer data-[selected=true]:bg-muted touch-manipulation"
                  >
                    <div className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 flex-shrink-0">
                      <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-foreground text-base">
                        {client.fullName}
                      </div>
                      <div className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                        {client.locationName || 'Otra localidad'}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {renderClientLoanInfo(client)}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Option to create new at bottom of list */}
            {allowCreate && searchTerm.length >= 2 && results.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreateNew}
                    className="text-blue-600 py-3 md:py-4 px-3 text-base data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700 dark:data-[selected=true]:bg-blue-950/50 touch-manipulation"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Crear nuevo {mode === 'borrower' ? 'cliente' : 'aval'}: &quot;{searchTerm}&quot;
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
