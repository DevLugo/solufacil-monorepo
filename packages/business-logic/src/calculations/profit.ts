import { Decimal } from 'decimal.js'

/**
 * =============================================================================
 * PROFIT CALCULATION MODULE
 * =============================================================================
 *
 * This module handles all profit-related calculations for loans and payments.
 *
 * KEY BUSINESS RULES:
 * -------------------
 * 1. profitAmount is ALWAYS calculated as: requestedAmount × rate
 *    - This applies to BOTH new loans AND renewals
 *    - Previous pending debt does NOT affect profitAmount
 *
 * 2. For renewals, the pending debt is handled differently:
 *    - amountGived = requestedAmount - previousPendingDebt
 *    - The profitAmount stays clean (based only on requestedAmount)
 *
 * 3. Bad Debt (mala deuda):
 *    - When a loan has badDebtDate set and payment is received after that date
 *    - 100% of the payment goes to profit (returnToCapital = 0)
 *    - This incentivizes collection after bad debt declaration
 *
 * FORMULAS:
 * ---------
 * - profitAmount = requestedAmount × rate
 * - totalDebtAcquired = requestedAmount + profitAmount
 * - expectedWeeklyPayment = totalDebtAcquired / weekDuration
 * - Payment profit distribution:
 *   - profitAmount = (paymentAmount × totalProfit) / totalDebtAcquired
 *   - returnToCapital = paymentAmount - profitAmount
 *
 * EXAMPLE (New Loan):
 * ------------------
 * - requestedAmount: $3,000
 * - rate: 40% (0.40)
 * - profitAmount: $3,000 × 0.40 = $1,200
 * - totalDebtAcquired: $3,000 + $1,200 = $4,200
 *
 * EXAMPLE (Renewal with $1,200 pending debt):
 * ------------------------------------------
 * - requestedAmount: $3,000
 * - amountGived: $3,000 - $1,200 = $1,800 (pending debt deducted)
 * - rate: 40% (0.40)
 * - profitAmount: $3,000 × 0.40 = $1,200 (based on requestedAmount!)
 * - totalDebtAcquired: $3,000 + $1,200 = $4,200
 *
 * =============================================================================
 */

/**
 * Calcula el profit (ganancia) de un préstamo
 *
 * @param requestedAmount - Monto solicitado del préstamo
 * @param rate - Tasa de ganancia (ej: 0.40 = 40%)
 * @returns Profit amount
 *
 * @example
 * // Loan of $3,000 with 40% rate
 * calculateProfit(new Decimal(3000), new Decimal(0.40))
 * // Returns: Decimal(1200)
 */
export function calculateProfit(requestedAmount: Decimal, rate: Decimal): Decimal {
  return requestedAmount.times(rate).toDecimalPlaces(2)
}

/**
 * Resultado del cálculo de distribución de profit en un pago
 */
export interface PaymentProfitResult {
  /** Porción del pago que corresponde a ganancia */
  profitAmount: Decimal
  /** Porción del pago que corresponde a retorno de capital */
  returnToCapital: Decimal
}

/**
 * Calcula la distribución proporcional de profit vs retorno a capital en un pago
 *
 * La fórmula es: profitAmount = (paymentAmount × totalProfit) / totalDebtAcquired
 *
 * @param paymentAmount - Monto del pago recibido
 * @param totalProfit - Ganancia total del préstamo (del campo profitAmount del loan)
 * @param totalDebtAcquired - Deuda total adquirida (capital + ganancia)
 * @param isBadDebt - Si el préstamo está en cartera vencida (badDebtDate existe)
 * @returns Objeto con profitAmount y returnToCapital
 *
 * @example
 * // Payment of $420 on a loan with $1,200 profit and $4,200 total debt
 * calculatePaymentProfit(
 *   new Decimal(420),   // paymentAmount
 *   new Decimal(1200),  // totalProfit
 *   new Decimal(4200),  // totalDebtAcquired
 *   false               // not bad debt
 * )
 * // Returns: { profitAmount: 120, returnToCapital: 300 }
 * // Because: 420 × (1200/4200) = 420 × 0.2857 ≈ 120
 *
 * @example
 * // Bad debt - 100% goes to profit
 * calculatePaymentProfit(
 *   new Decimal(420),
 *   new Decimal(1200),
 *   new Decimal(4200),
 *   true  // bad debt!
 * )
 * // Returns: { profitAmount: 420, returnToCapital: 0 }
 */
export function calculatePaymentProfit(
  paymentAmount: Decimal,
  totalProfit: Decimal,
  totalDebtAcquired: Decimal,
  isBadDebt: boolean = false
): PaymentProfitResult {
  // Si es bad debt, todo el pago es ganancia
  // Esto incentiva la cobranza después de declarar mala deuda
  if (isBadDebt) {
    return {
      profitAmount: paymentAmount,
      returnToCapital: new Decimal(0),
    }
  }

  // Evitar división por cero
  if (totalDebtAcquired.isZero()) {
    return {
      profitAmount: new Decimal(0),
      returnToCapital: paymentAmount,
    }
  }

  // Profit proporcional: (paymentAmount × totalProfit) / totalDebtAcquired
  const profitAmount = paymentAmount
    .times(totalProfit)
    .dividedBy(totalDebtAcquired)
    .toDecimalPlaces(2)

  const returnToCapital = paymentAmount.minus(profitAmount).toDecimalPlaces(2)

  return { profitAmount, returnToCapital }
}

/**
 * Resultado del cálculo de métricas de préstamo
 */
export interface LoanMetricsResult {
  /** Ganancia total del préstamo */
  profitAmount: Decimal
  /** Deuda total (capital + ganancia) */
  totalDebtAcquired: Decimal
  /** Pago semanal esperado */
  expectedWeeklyPayment: Decimal
}

/**
 * Calcula todas las métricas persistentes de un préstamo nuevo
 *
 * IMPORTANTE: Estas métricas se calculan ÚNICAMENTE basándose en requestedAmount.
 * Para renovaciones, la deuda pendiente se resta de amountGived, NO afecta
 * estas métricas.
 *
 * @param requestedAmount - Monto solicitado
 * @param rate - Tasa de ganancia (ej: 0.40 = 40%)
 * @param weekDuration - Duración en semanas
 * @returns Objeto con profitAmount, totalDebtAcquired, expectedWeeklyPayment
 *
 * @example
 * // New loan of $3,000 at 40% for 10 weeks
 * calculateLoanMetrics(
 *   new Decimal(3000),
 *   new Decimal(0.40),
 *   10
 * )
 * // Returns:
 * // {
 * //   profitAmount: 1200,
 * //   totalDebtAcquired: 4200,
 * //   expectedWeeklyPayment: 420
 * // }
 *
 * @example
 * // Renewal: Same calculation! The pending debt is handled separately
 * // in amountGived, NOT here.
 * calculateLoanMetrics(
 *   new Decimal(3000),  // requestedAmount stays the same
 *   new Decimal(0.40),
 *   10
 * )
 * // Returns same as above - pending debt doesn't change these metrics
 */
export function calculateLoanMetrics(
  requestedAmount: Decimal,
  rate: Decimal,
  weekDuration: number
): LoanMetricsResult {
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

/**
 * Calcula el monto a entregar en una renovación
 *
 * @param requestedAmount - Monto solicitado por el cliente
 * @param pendingDebt - Deuda pendiente del préstamo anterior
 * @returns Monto a entregar físicamente al cliente
 *
 * @example
 * // Client requests $3,000 but has $1,200 pending
 * calculateAmountToGive(
 *   new Decimal(3000),
 *   new Decimal(1200)
 * )
 * // Returns: Decimal(1800)
 */
export function calculateAmountToGive(
  requestedAmount: Decimal,
  pendingDebt: Decimal
): Decimal {
  const amountGived = requestedAmount.minus(pendingDebt)
  // Never give negative amount
  return amountGived.isNegative() ? new Decimal(0) : amountGived.toDecimalPlaces(2)
}
