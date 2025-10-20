/**
 * Fairness calculation utilities
 */

/**
 * Calculate mean (average)
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0

  const avg = mean(values)
  const squareDiffs = values.map((value) => Math.pow(value - avg, 2))
  const avgSquareDiff = mean(squareDiffs)

  return Math.sqrt(avgSquareDiff)
}

/**
 * Calculate fairness score from standard deviation
 * Lower std dev = higher score (more fair)
 */
export function calculateFairnessScore(stats: {
  hoursStdDev: number
  nightsStdDev: number
  weekendsStdDev: number
}): {
  overall: number
  hoursScore: number
  nightsScore: number
  weekendsScore: number
} {
  // Convert std dev to score (0-100)
  // Lower std dev = higher score
  const hoursScore = Math.max(0, 100 - stats.hoursStdDev * 2)
  const nightsScore = Math.max(0, 100 - stats.nightsStdDev * 10)
  const weekendsScore = Math.max(0, 100 - stats.weekendsStdDev * 20)

  // Weighted average
  // Hours: 40%, Nights: 35%, Weekends: 25%
  const overall =
    hoursScore * 0.4 + nightsScore * 0.35 + weekendsScore * 0.25

  return {
    overall: Math.round(overall * 100) / 100,
    hoursScore: Math.round(hoursScore * 100) / 100,
    nightsScore: Math.round(nightsScore * 100) / 100,
    weekendsScore: Math.round(weekendsScore * 100) / 100
  }
}

/**
 * Normalize scores to 0-100 range
 */
export function normalizeScore(value: number, min: number, max: number): number {
  if (max === min) return 100
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
}
