/**
 * Formatea un número como moneda en pesos mexicanos
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * Formatea un número como porcentaje
 */
export function formatPercentage(num: number, decimals: number = 2): string {
  return `${formatNumber(num, decimals)}%`
}
