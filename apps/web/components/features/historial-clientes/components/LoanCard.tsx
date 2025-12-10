'use client'

import { ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import { formatCurrency } from '../utils'
import type { LoanHistoryDetail } from '../types'

interface LoanCardProps {
  loan: LoanHistoryDetail
  isExpanded: boolean
  onToggleExpand: () => void
  isCollateral?: boolean
}

export function LoanCard({ loan, onToggleExpand, isCollateral = false }: LoanCardProps) {
  const progress = loan.totalAmountDue > 0
    ? Math.round((loan.totalPaid / loan.totalAmountDue) * 100)
    : 0

  const pendingDebt = loan.pendingDebt

  // Determine effective status - following Keystone logic exactly:
  // 1. Default: 'active'
  // 2. If status is FINISHED: 'completed'
  // 3. If wasRenewed is true: 'renewed' (overrides completed)
  const getEffectiveStatus = (): 'active' | 'completed' | 'renewed' | 'cancelled' => {
    // Start with default
    let status: 'active' | 'completed' | 'renewed' | 'cancelled' = 'active'

    // Check for completed status
    if (loan.status === 'FINISHED') {
      status = 'completed'
    }

    // Check for cancelled
    if (loan.status === 'CANCELLED') {
      status = 'cancelled'
    }

    // wasRenewed overrides other statuses (except cancelled)
    if (loan.wasRenewed && status !== 'cancelled') {
      status = 'renewed'
    }

    return status
  }

  const effectiveStatus = getEffectiveStatus()

  const getStatusVariant = () => {
    switch (effectiveStatus) {
      case 'active':
        return 'success'
      case 'completed':
        return 'default'
      case 'renewed':
        return 'info'
      case 'cancelled':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getStatusLabel = () => {
    switch (effectiveStatus) {
      case 'active':
        return 'Activo'
      case 'completed':
        return 'Terminado'
      case 'renewed':
        return 'Renovado'
      case 'cancelled':
        return 'Cancelado'
      default:
        return loan.status
    }
  }

  // Only show green border for truly active loans
  const isActive = effectiveStatus === 'active'

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors border-l-2"
      style={{ borderLeftColor: isActive ? 'hsl(var(--success))' : 'transparent' }}
      onClick={onToggleExpand}
    >
      <div className="p-2.5">
        {/* Row 1: Date, Status, Progress */}
        <div className="flex items-center gap-2 mb-2">
          <div className="text-xs font-medium">{loan.signDateFormatted}</div>
          <StatusBadge variant={getStatusVariant()}>
            {getStatusLabel()}
          </StatusBadge>

          {/* Progress Bar - fills remaining space */}
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  progress >= 100 ? 'bg-success' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground w-8">{progress}%</span>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>

        {/* Row 2: Amounts */}
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="text-muted-foreground">Prestado </span>
            <span className="font-semibold">{formatCurrency(loan.amountRequested)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Pagado </span>
            <span className="font-semibold text-success">{formatCurrency(loan.totalPaid)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Debe </span>
            <span className={`font-semibold ${pendingDebt > 0 ? 'text-destructive' : 'text-success'}`}>
              {formatCurrency(loan.pendingDebt)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
