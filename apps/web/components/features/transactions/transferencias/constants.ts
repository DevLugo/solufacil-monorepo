import {
  Wallet,
  Building2,
  User,
  Fuel,
  Briefcase,
  type LucideIcon,
} from 'lucide-react'
import type { AccountType } from './types'

// Account type to icon mapping
export const ACCOUNT_TYPE_ICONS: Record<AccountType, LucideIcon> = {
  BANK: Building2,
  OFFICE_CASH_FUND: Wallet,
  EMPLOYEE_CASH_FUND: User,
  PREPAID_GAS: Fuel,
  TRAVEL_EXPENSES: Briefcase,
}

// Account type labels
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  BANK: 'Banco',
  OFFICE_CASH_FUND: 'Caja Oficina',
  EMPLOYEE_CASH_FUND: 'Caja Empleado',
  PREPAID_GAS: 'Toka/Gasolina',
  TRAVEL_EXPENSES: 'Gastos de Viaje',
}

// Account type badge colors
export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  BANK: 'bg-green-50 text-green-700 border-green-200',
  OFFICE_CASH_FUND: 'bg-slate-50 text-slate-700 border-slate-200',
  EMPLOYEE_CASH_FUND: 'bg-blue-50 text-blue-700 border-blue-200',
  PREPAID_GAS: 'bg-orange-50 text-orange-700 border-orange-200',
  TRAVEL_EXPENSES: 'bg-purple-50 text-purple-700 border-purple-200',
}

// Transaction types
export const TRANSACTION_TYPES = {
  TRANSFER: 'TRANSFER',
  INCOME: 'INCOME',
} as const

// Income sources
export const INCOME_SOURCES = {
  MONEY_INVESTMENT: 'MONEY_INVESMENT', // Note: original typo in backend
} as const
