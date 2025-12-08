import type { ActiveLoan, RowStyle } from './types'

export function hasIncompleteAval(loan: ActiveLoan): boolean {
  if (!loan.collaterals || loan.collaterals.length === 0) {
    return true
  }
  const firstCollateral = loan.collaterals[0]
  const avalName = firstCollateral?.fullName || ''
  const avalPhone = firstCollateral?.phones?.[0]?.number || ''
  return !avalName || avalName.trim() === '' || !avalPhone || avalPhone.trim() === ''
}

export function hasIncompletePhone(loan: ActiveLoan): boolean {
  const phone = loan.borrower?.personalData?.phones?.[0]?.number
  return !phone || phone.trim() === ''
}

interface GetRowStyleParams {
  isMarkedForDeletion: boolean
  isEditing: boolean
  isRegistered: boolean
  isNoPayment: boolean
  isIncomplete: boolean
  hasPayment: boolean
  hasZeroCommission: boolean
  isTransfer: boolean
  isCash: boolean
}

export function getRowStyle(params: GetRowStyleParams): RowStyle {
  const {
    isMarkedForDeletion,
    isEditing,
    isRegistered,
    isNoPayment,
    isIncomplete,
    hasPayment,
    hasZeroCommission,
    isTransfer,
    isCash,
  } = params

  if (isMarkedForDeletion) {
    return {
      className: 'bg-red-100 dark:bg-red-950/50 line-through',
      borderColor: '#dc2626',
      borderWidth: '4px'
    }
  }
  if (isEditing) {
    return {
      className: 'bg-yellow-50 dark:bg-yellow-950/30',
      borderColor: '#eab308',
      borderWidth: '4px'
    }
  }
  if (isRegistered) {
    return {
      className: 'bg-slate-100 dark:bg-slate-800/50 opacity-75',
      borderColor: '#64748b',
      borderWidth: '4px'
    }
  }
  if (isNoPayment) {
    return {
      className: 'bg-red-100/80 dark:bg-red-950/40',
      borderColor: '#ef4444',
      borderWidth: '4px'
    }
  }
  if (isIncomplete && !hasPayment) {
    return {
      className: 'bg-orange-50 dark:bg-orange-950/30',
      borderColor: '#f97316',
      borderWidth: '4px'
    }
  }
  if (hasZeroCommission) {
    return {
      className: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: '#d97706',
      borderWidth: '4px'
    }
  }
  if (hasPayment && isTransfer) {
    return {
      className: 'bg-purple-50 dark:bg-purple-950/30',
      borderColor: '#8b5cf6',
      borderWidth: '4px'
    }
  }
  if (hasPayment && isCash) {
    return {
      className: 'bg-green-50 dark:bg-green-950/30',
      borderColor: '#22c55e',
      borderWidth: '4px'
    }
  }
  return {
    className: '',
    borderColor: 'transparent',
    borderWidth: '4px'
  }
}
