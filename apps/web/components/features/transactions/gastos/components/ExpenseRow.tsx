'use client'

import { Trash2, Edit, MoreHorizontal, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/lib/utils'
import { ALL_EXPENSE_TYPES, EXPENSE_SOURCE_LABELS, ACCOUNT_TYPE_LABELS } from '../constants'
import type { Expense, AccountType } from '../types'

interface ExpenseRowProps {
  expense: Expense
  onEdit: (expense: Expense) => void
  onDelete: (expenseId: string) => void
}

// Account type badge colors
const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  EMPLOYEE_CASH_FUND: 'bg-blue-50 text-blue-700 border-blue-200',
  PREPAID_GAS: 'bg-orange-50 text-orange-700 border-orange-200',
  TRAVEL_EXPENSES: 'bg-purple-50 text-purple-700 border-purple-200',
  BANK: 'bg-green-50 text-green-700 border-green-200',
  OFFICE_CASH_FUND: 'bg-slate-50 text-slate-700 border-slate-200',
}

// Commission expense types that are system-generated
const COMMISSION_EXPENSE_TYPES = ['LOAN_GRANTED', 'LOAN_GRANTED_COMISSION', 'LOAN_PAYMENT_COMISSION', 'LEAD_COMISSION']

export function ExpenseRow({ expense, onEdit, onDelete }: ExpenseRowProps) {
  const expenseType = ALL_EXPENSE_TYPES.find((t) => t.value === expense.expenseSource)
  const Icon = expenseType?.icon || Banknote
  const typeLabel = EXPENSE_SOURCE_LABELS[expense.expenseSource || ''] || expense.expenseSource || 'Sin tipo'
  const isCommissionType = COMMISSION_EXPENSE_TYPES.includes(expense.expenseSource || '')
  const accountType = expense.sourceAccount?.type as AccountType | undefined
  const accountBadgeColor = accountType ? ACCOUNT_TYPE_COLORS[accountType] : ''

  return (
    <TableRow className={isCommissionType ? 'bg-amber-50/50' : ''}>
      <TableCell>
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${isCommissionType ? 'text-amber-600' : 'text-muted-foreground'}`} />
          <span>{typeLabel}</span>
          {isCommissionType && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              Comision
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="font-medium text-red-600">
        -{formatCurrency(parseFloat(expense.amount))}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className={`text-xs ${accountBadgeColor}`}>
            {expense.sourceAccount?.name || 'Sin cuenta'}
          </Badge>
          {accountType && (
            <span className="text-xs text-muted-foreground">
              {ACCOUNT_TYPE_LABELS[accountType]}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {expense.lead?.personalData?.fullName || 'Sin lider'}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(expense)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(expense.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
