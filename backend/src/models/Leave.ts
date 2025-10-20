import { query } from '../db/connection.js'
import type { Leave, CreateLeaveInput, UpdateLeaveInput } from '@shared/types/index.js'

export class LeaveModel {
  /**
   * Get all leaves with optional filters
   */
  static async findAll(filters?: {
    nurse_id?: string
    month?: string // YYYY-MM
  }): Promise<Leave[]> {
    let sql = `
      SELECT l.*, n.name as nurse_name
      FROM leaves l
      JOIN nurses n ON l.nurse_id = n.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (filters?.nurse_id) {
      sql += ` AND l.nurse_id = $${paramIndex}`
      params.push(filters.nurse_id)
      paramIndex++
    }

    if (filters?.month) {
      // Get leaves that overlap with the given month
      const [year, month] = filters.month.split('-')
      const monthStart = `${year}-${month}-01`
      const monthEnd = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]

      sql += ` AND (
        (l.start_date <= $${paramIndex} AND l.end_date >= $${paramIndex}) OR
        (l.start_date <= $${paramIndex + 1} AND l.end_date >= $${paramIndex + 1}) OR
        (l.start_date >= $${paramIndex} AND l.end_date <= $${paramIndex + 1})
      )`
      params.push(monthStart, monthEnd)
      paramIndex += 2
    }

    sql += ' ORDER BY l.start_date DESC'

    const result = await query<Leave>(sql, params)
    return result.rows
  }

  /**
   * Get leave by ID
   */
  static async findById(id: string): Promise<Leave | null> {
    const result = await query<Leave>(
      `SELECT l.*, n.name as nurse_name
       FROM leaves l
       JOIN nurses n ON l.nurse_id = n.id
       WHERE l.id = $1`,
      [id]
    )
    return result.rows[0] || null
  }

  /**
   * Get leaves for a specific nurse in a date range
   */
  static async findByNurseAndDateRange(
    nurseId: string,
    startDate: string,
    endDate: string
  ): Promise<Leave[]> {
    const result = await query<Leave>(
      `SELECT l.*, n.name as nurse_name
       FROM leaves l
       JOIN nurses n ON l.nurse_id = n.id
       WHERE l.nurse_id = $1
         AND (
           (l.start_date <= $3 AND l.end_date >= $2) OR
           (l.start_date <= $3 AND l.end_date >= $3) OR
           (l.start_date >= $2 AND l.end_date <= $3)
         )
       ORDER BY l.start_date ASC`,
      [nurseId, startDate, endDate]
    )
    return result.rows
  }

  /**
   * Check if nurse is on leave on a specific date
   */
  static async isNurseOnLeave(nurseId: string, date: string): Promise<boolean> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM leaves
       WHERE nurse_id = $1
         AND start_date <= $2
         AND end_date >= $2
         AND type IN ('annual', 'excuse', 'sick')`,
      [nurseId, date]
    )
    return parseInt(result.rows[0].count) > 0
  }

  /**
   * Create new leave
   */
  static async create(input: CreateLeaveInput): Promise<Leave> {
    const result = await query<Leave>(
      `INSERT INTO leaves (nurse_id, type, start_date, end_date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.nurse_id, input.type, input.start_date, input.end_date, input.notes || null]
    )

    // Fetch with nurse_name
    return this.findById(result.rows[0].id) as Promise<Leave>
  }

  /**
   * Update leave
   */
  static async update(id: string, input: UpdateLeaveInput): Promise<Leave | null> {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (input.type !== undefined) {
      updates.push(`type = $${paramIndex}`)
      values.push(input.type)
      paramIndex++
    }

    if (input.start_date !== undefined) {
      updates.push(`start_date = $${paramIndex}`)
      values.push(input.start_date)
      paramIndex++
    }

    if (input.end_date !== undefined) {
      updates.push(`end_date = $${paramIndex}`)
      values.push(input.end_date)
      paramIndex++
    }

    if (input.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`)
      values.push(input.notes)
      paramIndex++
    }

    if (updates.length === 0) {
      return this.findById(id)
    }

    values.push(id)
    await query(
      `UPDATE leaves
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}`,
      values
    )

    return this.findById(id)
  }

  /**
   * Delete leave
   */
  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM leaves WHERE id = $1',
      [id]
    )
    return (result.rowCount || 0) > 0
  }
}
