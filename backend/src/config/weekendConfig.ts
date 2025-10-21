/**
 * Weekend configuration for the shift planner
 *
 * This defines which days of the week are considered weekends.
 * Days are numbered 0-6 where:
 * 0 = Sunday
 * 1 = Monday
 * 2 = Tuesday
 * 3 = Wednesday
 * 4 = Thursday
 * 5 = Friday
 * 6 = Saturday
 */

export interface WeekendConfig {
  days: number[]
  name: string
  description: string
}

// Turkey: Saturday and Sunday are weekends
export const TURKEY_WEEKEND: WeekendConfig = {
  days: [0, 6], // Sunday and Saturday
  name: 'Turkey',
  description: 'Turkish weekend (Saturday-Sunday)'
}

// Alternative: Some countries have Friday-Saturday
export const FRIDAY_SATURDAY_WEEKEND: WeekendConfig = {
  days: [5, 6], // Friday and Saturday
  name: 'Friday-Saturday',
  description: 'Friday-Saturday weekend'
}

// Alternative: Friday-Sunday (some Gulf countries)
export const GULF_WEEKEND: WeekendConfig = {
  days: [4, 5, 6], // Thursday, Friday, Saturday
  name: 'Gulf',
  description: 'Gulf countries weekend (Thursday-Saturday)'
}

// Default: Turkey (as specified)
export const DEFAULT_WEEKEND: WeekendConfig = TURKEY_WEEKEND

/**
 * Get the current weekend configuration
 * Can be overridden via environment variable WEEKEND_CONFIG
 */
export function getWeekendConfig(): WeekendConfig {
  const configName = process.env.WEEKEND_CONFIG || 'TURKEY'

  switch (configName.toUpperCase()) {
    case 'FRIDAY_SATURDAY':
      return FRIDAY_SATURDAY_WEEKEND
    case 'GULF':
      return GULF_WEEKEND
    case 'TURKEY':
    default:
      return TURKEY_WEEKEND
  }
}

/**
 * Check if a day of week is a weekend day
 * @param dayOfWeek - Day of week (0-6, where 0 is Sunday)
 */
export function isWeekendDay(dayOfWeek: number): boolean {
  const config = getWeekendConfig()
  return config.days.includes(dayOfWeek)
}
