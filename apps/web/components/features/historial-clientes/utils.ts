import type {
  LoanHistoryDetail,
  PaymentChronologyItem,
  CoverageType,
} from './types'

// ============================================================
// TRANSLATION FUNCTIONS - English to Spanish
// ============================================================

// Payment method labels
export const paymentMethodLabels: Record<string, string> = {
  CASH: 'Efectivo',
  MONEY_TRANSFER: 'Transferencia',
  CHECK: 'Cheque',
  CARD: 'Tarjeta',
}

export const formatPaymentMethod = (method: string): string =>
  paymentMethodLabels[method] || method

// Loan status labels
export const loanStatusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  FINISHED: 'Terminado',
  RENOVATED: 'Renovado',
  CANCELLED: 'Cancelado',
  BAD_DEBT: 'Cartera Vencida',
}

export const formatLoanStatus = (status: string): string =>
  loanStatusLabels[status] || status

// Payment type labels (income source)
export const paymentTypeLabels: Record<string, string> = {
  PAYMENT: 'Abono',
  LOAN_PAYMENT: 'Abono de Préstamo',
  COMMISSION: 'Comisión',
  PENALTY: 'Multa',
  INTEREST: 'Interés',
}

export const formatPaymentType = (type: string): string =>
  paymentTypeLabels[type] || type

// Coverage type labels
export const coverageTypeLabels: Record<string, string> = {
  FULL: 'Completo',
  COVERED_BY_SURPLUS: 'Cubierto por Sobrepago',
  PARTIAL: 'Parcial',
  MISS: 'Sin Pago',
}

export const formatCoverageType = (coverage: string): string =>
  coverageTypeLabels[coverage] || coverage

// ============================================================
// DATE FORMATTING
// ============================================================

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-SV', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numAmount)) return '$0'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount)
}

// ============================================================
// PAYMENT CHRONOLOGY - Week by week analysis
// ============================================================

interface LoanDataForChronology {
  signDate: string
  finishedDate?: string | null
  status?: string
  badDebtDate?: string | null
  amountGived?: number
  profitAmount?: number
  totalAmountDue?: number
  weekDuration?: number
  payments?: Array<{
    id: string
    receivedAt: string
    receivedAtFormatted?: string
    amount: number
    paymentMethod: string
    balanceBeforePayment: number
    balanceAfterPayment: number
    paymentNumber?: number
  }>
}

export const generatePaymentChronology = (
  loan: LoanDataForChronology
): PaymentChronologyItem[] => {
  const chronology: PaymentChronologyItem[] = []

  if (!loan.signDate) return chronology

  const signDate = new Date(loan.signDate)
  const now = new Date()

  // Determine end date for evaluation
  let endDate: Date

  if (
    loan.finishedDate &&
    (loan.status === 'FINISHED' || loan.status === 'RENOVATED')
  ) {
    endDate = new Date(loan.finishedDate)
  } else if (loan.badDebtDate) {
    endDate = new Date(loan.badDebtDate)
  } else {
    const amount = loan.amountGived || 0
    const maxWeeks = Math.max(loan.weekDuration || 12, Math.ceil(amount / 100))
    const maxEndDate = new Date(signDate)
    maxEndDate.setDate(maxEndDate.getDate() + maxWeeks * 7)
    endDate = new Date(Math.min(now.getTime(), maxEndDate.getTime()))
  }

  // Calculate total weeks
  let totalWeeks: number
  if (
    loan.finishedDate &&
    (loan.status === 'FINISHED' || loan.status === 'RENOVATED')
  ) {
    totalWeeks = Math.ceil(
      (new Date(loan.finishedDate).getTime() - signDate.getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    )
  } else if (loan.badDebtDate) {
    totalWeeks = Math.ceil(
      (new Date(loan.badDebtDate).getTime() - signDate.getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    )
  } else {
    const amount = loan.amountGived || 0
    const maxWeeks = Math.max(loan.weekDuration || 12, Math.ceil(amount / 100))
    totalWeeks = Math.min(
      maxWeeks,
      Math.ceil(
        (endDate.getTime() - signDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      )
    )
  }

  // Sort payments by date
  const sortedPayments = [...(loan.payments || [])].sort(
    (a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
  )

  // Calculate expected weekly payment
  const totalDue = loan.totalAmountDue ?? (loan.amountGived || 0) + (loan.profitAmount || 0)
  const durationWeeks = loan.weekDuration || 16
  const expectedWeekly = durationWeeks > 0 ? totalDue / durationWeeks : 0

  // Generate chronology week by week
  for (let week = 1; week <= totalWeeks; week++) {
    const weekPaymentDate = new Date(signDate)
    weekPaymentDate.setDate(weekPaymentDate.getDate() + week * 7)

    // Calculate Monday and Sunday for the week
    const weekMonday = new Date(weekPaymentDate)
    const dayOfWeekMonday = weekMonday.getDay()
    const daysToMonday = dayOfWeekMonday === 0 ? -6 : 1 - dayOfWeekMonday
    weekMonday.setDate(weekMonday.getDate() + daysToMonday)
    weekMonday.setHours(0, 0, 0, 0)

    const weekSunday = new Date(weekMonday)
    weekSunday.setDate(weekSunday.getDate() + 6)
    weekSunday.setHours(23, 59, 59, 999)

    // Find all payments in this week
    const paymentsInWeek = sortedPayments.filter((payment) => {
      const paymentDate = new Date(payment.receivedAt)
      return paymentDate >= weekMonday && paymentDate <= weekSunday
    })

    // Calculate paid before and in the week
    const paidBeforeWeek = (loan.payments || []).reduce((sum, p) => {
      const d = new Date(p.receivedAt).getTime()
      return d < weekMonday.getTime() ? sum + (p.amount || 0) : sum
    }, 0)

    const weeklyPaid = paymentsInWeek.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    )
    const expectedBefore = (week - 1) * expectedWeekly
    const surplusBefore = paidBeforeWeek - expectedBefore
    const coversWithSurplus =
      surplusBefore + weeklyPaid >= expectedWeekly && expectedWeekly > 0

    let coverageType: CoverageType = 'MISS'
    if (weeklyPaid >= expectedWeekly) coverageType = 'FULL'
    else if (coversWithSurplus && weeklyPaid > 0)
      coverageType = 'COVERED_BY_SURPLUS'
    else if (coversWithSurplus && weeklyPaid === 0)
      coverageType = 'COVERED_BY_SURPLUS'
    else if (weeklyPaid > 0) coverageType = 'PARTIAL'

    // Add payments found in this week
    if (paymentsInWeek.length > 0) {
      paymentsInWeek.forEach((payment, index) => {
        chronology.push({
          id: `payment-${payment.id}`,
          date: payment.receivedAt,
          dateFormatted:
            payment.receivedAtFormatted || formatDate(payment.receivedAt),
          type: 'PAYMENT',
          description:
            paymentsInWeek.length > 1
              ? `Pago #${index + 1} (${index + 1}/${paymentsInWeek.length})`
              : `Pago #${payment.paymentNumber || index + 1}`,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          balanceBefore: payment.balanceBeforePayment,
          balanceAfter: payment.balanceAfterPayment,
          paymentNumber: payment.paymentNumber || index + 1,
          weekIndex: week,
          weeklyExpected: expectedWeekly,
          weeklyPaid,
          surplusBefore,
          surplusAfter: surplusBefore + weeklyPaid - expectedWeekly,
          coverageType,
        })
      })
    } else {
      // Check if we should show "no payment"
      const isLoanFinished =
        loan.finishedDate &&
        (loan.status === 'FINISHED' || loan.status === 'RENOVATED')
      const weekIsBeforeFinish =
        !loan.finishedDate || weekPaymentDate <= new Date(loan.finishedDate)
      const weekIsBeforeDeadDebt =
        !loan.badDebtDate || weekPaymentDate <= new Date(loan.badDebtDate)

      const shouldShowNoPayment =
        now > weekSunday && weekIsBeforeFinish && weekIsBeforeDeadDebt

      if (shouldShowNoPayment) {
        const coverageForNoPayment: CoverageType =
          surplusBefore >= expectedWeekly && expectedWeekly > 0
            ? 'COVERED_BY_SURPLUS'
            : 'MISS'
        const desc =
          coverageForNoPayment === 'COVERED_BY_SURPLUS'
            ? 'Sin pago (cubierto por sobrepago)'
            : 'Sin pago'

        chronology.push({
          id: `no-payment-${week}`,
          date: weekPaymentDate.toISOString(),
          dateFormatted: formatDate(weekPaymentDate.toISOString()),
          type: 'NO_PAYMENT',
          description: desc,
          weekCount: 1,
          weekIndex: week,
          weeklyExpected: expectedWeekly,
          weeklyPaid: 0,
          surplusBefore,
          surplusAfter: surplusBefore - expectedWeekly,
          coverageType: coverageForNoPayment,
        })
      }
    }
  }

  // Sort chronology by date
  return chronology.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

// ============================================================
// UI HELPER FUNCTIONS
// ============================================================

export const getStatusBadgeVariant = (
  status: string
): 'success' | 'default' | 'purple' | 'destructive' => {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'FINISHED':
      return 'default'
    case 'RENOVATED':
      return 'purple'
    case 'CANCELLED':
      return 'destructive'
    default:
      return 'default'
  }
}

export const getCoverageColor = (
  coverage: CoverageType | undefined,
  isDark: boolean = false
): string => {
  switch (coverage) {
    case 'FULL':
      return isDark
        ? 'bg-green-900 border-green-700'
        : 'bg-green-50 border-green-200'
    case 'COVERED_BY_SURPLUS':
      return isDark
        ? 'bg-blue-900 border-blue-700'
        : 'bg-blue-50 border-blue-200'
    case 'PARTIAL':
      return isDark
        ? 'bg-amber-900 border-amber-700'
        : 'bg-amber-50 border-amber-200'
    case 'MISS':
      return isDark ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'
    default:
      return ''
  }
}

// Map loan from API to card format
export const mapLoanToCardData = (loan: LoanHistoryDetail) => {
  const chronology = generatePaymentChronology({
    signDate: loan.signDate,
    finishedDate: loan.finishedDate,
    status: loan.status,
    amountGived: loan.amountRequested,
    profitAmount: loan.interestAmount,
    totalAmountDue: loan.totalAmountDue,
    weekDuration: loan.weekDuration,
    payments: loan.payments.map((p) => ({
      id: p.id,
      receivedAt: p.receivedAt,
      receivedAtFormatted: p.receivedAtFormatted,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      balanceBeforePayment: p.balanceBeforePayment,
      balanceAfterPayment: p.balanceAfterPayment,
      paymentNumber: p.paymentNumber,
    })),
  })

  const payments = chronology.map((item, idx) => ({
    id: item.paymentNumber || idx + 1,
    date: item.dateFormatted,
    expected: item.weeklyExpected || 0,
    paid: item.amount || 0,
    surplus: item.surplusAfter || 0,
    status: getPaymentStatus(item),
  }))

  let status: 'active' | 'completed' | 'renewed' = 'active'
  if (loan.status === 'FINISHED') status = 'completed'
  if (loan.wasRenewed || loan.status === 'RENOVATED') status = 'renewed'

  return {
    id: loan.id,
    date: loan.signDateFormatted,
    status,
    amount: loan.amountRequested,
    totalAmount: loan.totalAmountDue,
    paidAmount: loan.totalPaid,
    remainingAmount: loan.pendingDebt,
    guarantor: {
      name: loan.avalName || 'N/A',
      phone: loan.avalPhone || 'N/A',
    },
    weekCount: loan.weekDuration,
    interestRate: loan.rate,
    interestAmount: loan.interestAmount,
    payments,
    renovationId: loan.renewedFrom || undefined,
  }
}

const getPaymentStatus = (
  item: PaymentChronologyItem
): 'paid' | 'partial' | 'missed' | 'overpaid' | 'upcoming' => {
  if (item.type === 'NO_PAYMENT') {
    return item.coverageType === 'COVERED_BY_SURPLUS' ? 'paid' : 'missed'
  }
  if (item.coverageType === 'FULL') return 'overpaid'
  if (item.coverageType === 'PARTIAL') return 'partial'
  if (item.coverageType === 'COVERED_BY_SURPLUS') return 'paid'
  return 'paid'
}
