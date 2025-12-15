/**
 * Utility functions for formatting values in portfolio reports.
 * Centralizes formatting logic to avoid duplication across components.
 */

/**
 * Formats a number as Mexican Peso currency.
 *
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "$1,234")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Formats a date string to a short format (e.g., "15 dic").
 *
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string
 */
export function formatDateShort(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

/**
 * Formats a date string with year (e.g., "15 dic 2024").
 *
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string with year
 */
export function formatDateWithYear(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Formats a date range as "15 dic - 21 dic".
 *
 * @param start - Start date (ISO string or Date)
 * @param end - End date (ISO string or Date)
 * @returns Formatted date range string
 */
export function formatDateRange(
  start: string | Date,
  end: string | Date
): string {
  const startDate = typeof start === 'string' ? new Date(start) : start
  const endDate = typeof end === 'string' ? new Date(end) : end
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${startDate.toLocaleDateString('es-MX', options)} - ${endDate.toLocaleDateString('es-MX', options)}`
}

/**
 * Formats a week number with prefix (e.g., "S51").
 *
 * @param weekNumber - The ISO week number
 * @returns Formatted week label
 */
export function formatWeekLabel(weekNumber: number): string {
  return `S${weekNumber}`
}

/**
 * Formats a percentage value with specified decimal places.
 *
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "85.5%")
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Formats a number with thousands separator.
 *
 * @param value - The numeric value
 * @returns Formatted number string (e.g., "1,234")
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-MX').format(value)
}
