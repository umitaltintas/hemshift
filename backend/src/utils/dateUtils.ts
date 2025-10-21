/**
 * Date utility functions for scheduler
 */

import { isWeekendDay } from '../config/weekendConfig'

/**
 * Get number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Check if date is weekend based on current weekend configuration
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return isWeekendDay(day)
}

/**
 * Check if date is a Turkish public holiday
 * TODO: Implement actual holiday calendar
 */
export function isHoliday(_date: Date): boolean {
  // For now, no holidays
  // Future: Add Turkish public holidays
  return false
}

/**
 * Format date as YYYY-MM-DD (in local timezone, not UTC)
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse YYYY-MM string to Date (first day of month)
 */
export function parseMonth(month: string): Date {
  const [year, monthNum] = month.split('-').map(Number)
  return new Date(year, monthNum - 1, 1)
}

/**
 * Get all dates in a month
 * @param year - The year
 * @param month - The 0-indexed month (0 = January, 11 = December)
 */
export function getMonthDates(year: number, month: number): Date[] {
  const days = getDaysInMonth(year, month)
  const dates: Date[] = []

  for (let day = 1; day <= days; day++) {
    dates.push(new Date(year, month, day))
  }

  return dates
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Check if date is in range (inclusive)
 */
export function isDateInRange(
  date: Date,
  startDate: Date,
  endDate: Date
): boolean {
  return date >= startDate && date <= endDate
}
