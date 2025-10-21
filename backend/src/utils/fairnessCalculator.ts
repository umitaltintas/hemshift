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

/**
 * Weighted random selection
 * Selects items from a scored list where items with lower scores have higher probability
 * @param scoredItems Array of {item, score} tuples
 * @param count Number of items to select
 * @returns Selected items
 */
export function weightedRandomSelection<T>(
  scoredItems: Array<{ item: T; score: number }>,
  count: number
): T[] {
  if (scoredItems.length === 0) return []
  if (count >= scoredItems.length) return scoredItems.map((s) => s.item)

  // Find max score to invert it (lower score = higher probability)
  const scores = scoredItems.map((s) => s.score)
  const maxScore = Math.max(...scores)

  // Convert scores to weights (lower score = higher weight)
  // Weight = (maxScore - score) + 1 to ensure all weights are positive
  const weights = scoredItems.map((s) => {
    const inverted = maxScore - s.score + 1
    return Math.max(0.1, inverted) // Minimum weight to ensure every item has a chance
  })

  const selected: T[] = []
  const remaining = [...scoredItems]

  // Select count items using weighted random selection
  for (let i = 0; i < count && remaining.length > 0; i++) {
    // Calculate cumulative weights for remaining items
    const cumulativeWeights: number[] = []
    let sum = 0
    for (let j = 0; j < remaining.length; j++) {
      const idx = scoredItems.indexOf(remaining[j])
      sum += weights[idx]
      cumulativeWeights.push(sum)
    }

    // Generate random number and select item
    const random = Math.random() * sum
    let selectedIdx = 0
    for (let j = 0; j < cumulativeWeights.length; j++) {
      if (random <= cumulativeWeights[j]) {
        selectedIdx = j
        break
      }
    }

    selected.push(remaining[selectedIdx].item)
    remaining.splice(selectedIdx, 1)
  }

  return selected
}
