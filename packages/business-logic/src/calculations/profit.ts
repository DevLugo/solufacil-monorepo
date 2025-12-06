import { Decimal } from 'decimal.js'

/**
 * Calcula el profit (ganancia) de un préstamo
 * @param requestedAmount - Monto solicitado del préstamo
 * @param rate - Tasa de ganancia (ej: 0.20 = 20%)
 * @returns Profit amount
 */
export function calculateProfit(requestedAmount: Decimal, rate: Decimal): Decimal {
  return requestedAmount.times(rate).toDecimalPlaces(2)
}

/**
 * Calcula la distribución de profit vs retorno a capital en un pago
 * @param paymentAmount - Monto del pago
 * @param totalProfit - Ganancia total del préstamo
 * @param totalDebtAcquired - Deuda total adquirida (capital + ganancia)
 * @param isBadDebt - Si es préstamo en cartera vencida
 * @returns Objeto con profitAmount y returnToCapital
 */
export function calculatePaymentProfit(
  paymentAmount: Decimal,
  totalProfit: Decimal,
  totalDebtAcquired: Decimal,
  isBadDebt: boolean = false
): { profitAmount: Decimal; returnToCapital: Decimal } {
  // Si es bad debt, todo el pago es ganancia
  if (isBadDebt) {
    return {
      profitAmount: paymentAmount,
      returnToCapital: new Decimal(0),
    }
  }

  // Profit proporcional: (paymentAmount * totalProfit) / totalDebtAcquired
  const profitAmount = paymentAmount
    .times(totalProfit)
    .dividedBy(totalDebtAcquired)
    .toDecimalPlaces(2)

  const returnToCapital = paymentAmount.minus(profitAmount).toDecimalPlaces(2)

  return { profitAmount, returnToCapital }
}

/**
 * Calcula todas las métricas persistentes de un préstamo
 * @param requestedAmount - Monto solicitado
 * @param rate - Tasa de ganancia
 * @param weekDuration - Duración en semanas
 * @returns Objeto con todas las métricas
 */
export function calculateLoanMetrics(
  requestedAmount: Decimal,
  rate: Decimal,
  weekDuration: number
): {
  profitAmount: Decimal
  totalDebtAcquired: Decimal
  expectedWeeklyPayment: Decimal
} {
  const profitAmount = calculateProfit(requestedAmount, rate)
  const totalDebtAcquired = requestedAmount.plus(profitAmount).toDecimalPlaces(2)
  const expectedWeeklyPayment = totalDebtAcquired
    .dividedBy(weekDuration)
    .toDecimalPlaces(2)

  return {
    profitAmount,
    totalDebtAcquired,
    expectedWeeklyPayment,
  }
}
