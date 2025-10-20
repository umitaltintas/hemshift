import { query } from '../db/connection.js'
import type { ApiNurse, CreateNurseInput, UpdateNurseInput } from '../types/api.js'

export class NurseModel {
  /**
   * Get all nurses
   */
  static async findAll(): Promise<ApiNurse[]> {
    const result = await query<ApiNurse>(
      'SELECT * FROM nurses ORDER BY role DESC, name ASC'
    )
    return result.rows
  }

  /**
   * Get nurse by ID
   */
  static async findById(id: string): Promise<ApiNurse | null> {
    const result = await query<ApiNurse>(
      'SELECT * FROM nurses WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  }

  /**
   * Get responsible nurse
   */
  static async findResponsible(): Promise<ApiNurse | null> {
    const result = await query<ApiNurse>(
      "SELECT * FROM nurses WHERE role = 'responsible' LIMIT 1"
    )
    return result.rows[0] || null
  }

  /**
   * Get all staff nurses
   */
  static async findStaff(): Promise<ApiNurse[]> {
    const result = await query<ApiNurse>(
      "SELECT * FROM nurses WHERE role = 'staff' ORDER BY name ASC"
    )
    return result.rows
  }

  /**
   * Create new nurse
   */
  static async create(input: CreateNurseInput): Promise<ApiNurse> {
    const result = await query<ApiNurse>(
      `INSERT INTO nurses (name, role)
       VALUES ($1, $2)
       RETURNING *`,
      [input.name, input.role]
    )
    return result.rows[0]
  }

  /**
   * Update nurse
   */
  static async update(id: string, input: UpdateNurseInput): Promise<ApiNurse | null> {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (input.name !== undefined) {
      updates.push(`name = $${paramIndex}`)
      values.push(input.name)
      paramIndex++
    }

    if (updates.length === 0) {
      return this.findById(id)
    }

    values.push(id)
    const result = await query<ApiNurse>(
      `UPDATE nurses
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    )

    return result.rows[0] || null
  }

  /**
   * Delete nurse
   */
  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM nurses WHERE id = $1',
      [id]
    )
    return (result.rowCount || 0) > 0
  }

  /**
   * Check if responsible nurse exists
   */
  static async hasResponsible(): Promise<boolean> {
    const result = await query<{ count: string }>(
      "SELECT COUNT(*) as count FROM nurses WHERE role = 'responsible'"
    )
    return parseInt(result.rows[0].count) > 0
  }

  /**
   * Count staff nurses
   */
  static async countStaff(): Promise<number> {
    const result = await query<{ count: string }>(
      "SELECT COUNT(*) as count FROM nurses WHERE role = 'staff'"
    )
    return parseInt(result.rows[0].count)
  }
}
