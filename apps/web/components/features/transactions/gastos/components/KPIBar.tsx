'use client'

import { Plus, Save, Loader2, Split } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { ExpenseTotals } from '../types'

interface KPIBarProps {
  totals: ExpenseTotals
  expenseCount: number
  newExpenseCount: number
  onAddExpense: () => void
  onAddDistributedExpense: () => void
  onSaveAll: () => void
  isSaving: boolean
}

export function KPIBar({
  totals,
  expenseCount,
  newExpenseCount,
  onAddExpense,
  onAddDistributedExpense,
  onSaveAll,
  isSaving,
}: KPIBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg border">
      <Badge variant="outline" className="text-sm py-1 px-3">
        Gastos: {expenseCount + newExpenseCount}
      </Badge>
      {newExpenseCount > 0 && (
        <Badge
          variant="outline"
          className="text-sm py-1 px-3 bg-amber-50 text-amber-700 border-amber-200"
        >
          Nuevos: {newExpenseCount}
        </Badge>
      )}
      <Badge
        variant="outline"
        className="text-sm py-1 px-3 bg-red-50 text-red-700 border-red-200"
      >
        Total: {formatCurrency(totals.total)}
      </Badge>

      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onAddExpense} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar Gasto
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onAddDistributedExpense}
          className="gap-2"
        >
          <Split className="h-4 w-4" />
          Distribuir
        </Button>

        {newExpenseCount > 0 && (
          <Button size="sm" onClick={onSaveAll} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar cambios
          </Button>
        )}
      </div>
    </div>
  )
}
