'use client'

import {
  Search,
  Loader2,
  DollarSign,
  Trash2,
  Save,
  Plus,
  Gavel,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ActionBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  globalCommission: string
  onGlobalCommissionChange: (value: string) => void
  onApplyGlobalCommission: () => void
  onSetAllWeekly: () => void
  onClearAll: () => void
  onAddPayment: () => void
  onOpenMultaModal: () => void
  onSaveAll: () => void
  onSaveEditedPayments: () => void
  filteredLoansCount: number
  totalsCount: number
  totalsNoPayment: number
  userAddedPaymentsCount: number
  isSubmitting: boolean
  isSavingEdits: boolean
  hasEditedPayments: boolean
  editedCount: number
  deletedCount: number
}

export function ActionBar({
  searchTerm,
  onSearchChange,
  globalCommission,
  onGlobalCommissionChange,
  onApplyGlobalCommission,
  onSetAllWeekly,
  onClearAll,
  onAddPayment,
  onOpenMultaModal,
  onSaveAll,
  onSaveEditedPayments,
  filteredLoansCount,
  totalsCount,
  totalsNoPayment,
  userAddedPaymentsCount,
  isSubmitting,
  isSavingEdits,
  hasEditedPayments,
  editedCount,
  deletedCount,
}: ActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mt-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-8"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Comisión:</span>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
            <Input
              type="number"
              placeholder="0"
              value={globalCommission}
              onChange={(e) => onGlobalCommissionChange(e.target.value)}
              className="w-[60px] h-7 text-sm pl-5 pr-1"
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={onApplyGlobalCommission}
            disabled={!globalCommission || filteredLoansCount === 0}
            className="h-7 px-2 text-xs"
          >
            Aplicar
          </Button>
        </div>

        <div className="h-5 w-px bg-border" />

        <Button
          size="sm"
          variant="outline"
          onClick={onSetAllWeekly}
          disabled={filteredLoansCount === 0}
          className="h-8 px-2"
          title="Aplicar pago semanal a todos"
        >
          <DollarSign className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onClearAll}
          disabled={totalsCount === 0 && totalsNoPayment === 0 && userAddedPaymentsCount === 0}
          className="h-8 px-2"
          title="Limpiar todos los pagos"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onAddPayment}
          className="h-8 px-2 gap-1.5 text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          title="Agregar pago manual"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Agregar Pago</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenMultaModal}
          className="h-8 px-2 gap-1.5 text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
          title="Registrar multa"
        >
          <Gavel className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Multa</span>
        </Button>

        {totalsCount > 0 && !hasEditedPayments && (
          <>
            <div className="h-5 w-px bg-border" />
            <Button
              size="sm"
              onClick={onSaveAll}
              disabled={isSubmitting}
              className="gap-1.5 h-8"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Guardar ({totalsCount})
            </Button>
          </>
        )}

        {hasEditedPayments && (
          <>
            <div className="h-5 w-px bg-border" />
            <Button
              size="sm"
              onClick={onSaveEditedPayments}
              disabled={isSavingEdits}
              className="gap-1.5 h-8 bg-yellow-600 hover:bg-yellow-700"
            >
              {isSavingEdits ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Pencil className="h-3.5 w-3.5" />
              )}
              Guardar Cambios ({editedCount + deletedCount})
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
