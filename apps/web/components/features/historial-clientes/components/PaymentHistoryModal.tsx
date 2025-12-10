'use client'

import { useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '../utils'
import type { LoanHistoryDetail, LoanPaymentDetail } from '../types'

interface PaymentHistoryModalProps {
  loan: LoanHistoryDetail
  isOpen: boolean
  onClose: () => void
}

interface PaymentWithDebt extends LoanPaymentDetail {
  remainingDebt: number
  isDoublePayment: boolean
}

export function PaymentHistoryModal({ loan, isOpen, onClose }: PaymentHistoryModalProps) {
  // Use balanceAfterPayment from API (already calculated with totalAmountDue = amountGived + profitAmount)
  const paymentsWithDebt = useMemo((): PaymentWithDebt[] => {
    if (!loan.payments || loan.payments.length === 0) return []

    // Sort payments by date
    const sortedPayments = [...loan.payments].sort(
      (a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
    )

    // Detect double payments (same date)
    const paymentDates = sortedPayments.map(p => formatDate(p.receivedAt))
    const duplicateDates = paymentDates.filter(
      (date, index) => paymentDates.indexOf(date) !== index
    )

    // Use API's balanceAfterPayment which is already correctly calculated
    return sortedPayments.map((payment): PaymentWithDebt => {
      const isDoublePayment = duplicateDates.includes(formatDate(payment.receivedAt))

      return {
        ...payment,
        remainingDebt: payment.balanceAfterPayment,
        isDoublePayment,
      }
    })
  }, [loan.payments])

  // Calculate expected weekly payment
  const expectedWeekly = loan.weekDuration > 0 ? loan.totalAmountDue / loan.weekDuration : 0

  const getRowStyles = (payment: PaymentWithDebt, expectedWeekly: number) => {
    if (payment.isDoublePayment) {
      return 'bg-info/5 border-l-4 border-l-info'
    }
    // Determine if payment was full, partial, or overpaid
    if (payment.amount >= expectedWeekly * 1.5) {
      return 'bg-success/5 border-l-4 border-l-success' // Overpaid
    }
    if (payment.amount >= expectedWeekly) {
      return '' // Normal full payment
    }
    if (payment.amount > 0) {
      return 'bg-warning/5 border-l-4 border-l-warning' // Partial
    }
    return 'bg-destructive/5 border-l-4 border-l-destructive' // Missed
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 pb-2 border-b bg-muted/30 flex-shrink-0">
          <DialogTitle className="text-base">
            Historial de Pagos
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {loan.signDateFormatted} • {loan.weekDuration} semanas
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-3 md:p-4">
            {/* Loan Summary - Match outside cards style */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-success truncate">{formatCurrency(loan.amountRequested)}</div>
                  <div className="text-[10px] text-muted-foreground">prestado</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{formatCurrency(loan.totalAmountDue)}</div>
                  <div className="text-[10px] text-muted-foreground">total</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-success truncate">{formatCurrency(loan.totalPaid)}</div>
                  <div className="text-[10px] text-muted-foreground">pagado</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50">
                <div className="min-w-0">
                  <div className={`text-xs font-bold truncate ${loan.pendingDebt > 0 ? 'text-destructive' : 'text-success'}`}>
                    {formatCurrency(loan.pendingDebt)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">debe</div>
                </div>
              </div>
            </div>

            {/* Legend - Compact inline */}
            <div className="flex flex-wrap gap-1.5 mb-3 text-[9px]">
              <span className="px-1.5 py-0.5 rounded bg-success/10 border-l-2 border-l-success">Completo</span>
              <span className="px-1.5 py-0.5 rounded bg-info/10 border-l-2 border-l-info">Sobrepago</span>
              <span className="px-1.5 py-0.5 rounded bg-warning/10 border-l-2 border-l-warning">Parcial</span>
              <span className="px-1.5 py-0.5 rounded bg-destructive/10 border-l-2 border-l-destructive">Sin Pago</span>
            </div>

            {/* Payment Table - Compact for mobile */}
            <div className="border rounded-lg overflow-hidden">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-8 px-2 py-1.5 text-xs">#</TableHead>
                    <TableHead className="px-2 py-1.5 text-xs">Fecha</TableHead>
                    <TableHead className="text-right px-2 py-1.5 text-xs">Pagado</TableHead>
                    <TableHead className="text-right px-2 py-1.5 text-xs">Deuda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsWithDebt.map((payment, idx) => (
                    <TableRow
                      key={payment.id}
                      className={cn(getRowStyles(payment, expectedWeekly), 'text-xs')}
                    >
                      <TableCell className="font-medium text-muted-foreground px-2 py-1.5">
                        {payment.paymentNumber || idx + 1}
                      </TableCell>
                      <TableCell className="px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          <span className="whitespace-nowrap">{payment.receivedAtFormatted || formatDate(payment.receivedAt)}</span>
                          {payment.isDoublePayment && (
                            <span className="text-[8px] font-bold text-info">2x</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-2 py-1.5 font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-right px-2 py-1.5 font-medium">
                        <span
                          className={cn(
                            payment.remainingDebt === 0
                              ? 'text-success'
                              : 'text-destructive'
                          )}
                        >
                          {formatCurrency(payment.remainingDebt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Empty state if no payments */}
            {paymentsWithDebt.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Sin pagos registrados
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
