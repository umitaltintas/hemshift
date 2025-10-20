import { query } from '../db/connection.js'
import type {
  ApiShift,
  CreateShiftInput,
  ApiShiftAssignment,
  CreateAssignmentInput
} from '../types/api.js'

export class ShiftModel {
  /**
   * Get all shifts for a schedule
   */
  static async findBySchedule(scheduleId: string): Promise<ApiShift[]> {
    const result = await query<ApiShift>(
      'SELECT * FROM shifts WHERE schedule_id = $1 ORDER BY date, type',
      [scheduleId]
    )
    return result.rows
  }

  /**
   * Get shift by ID
   */
  static async findById(id: string): Promise<ApiShift | null> {
    const result = await query<ApiShift>(
      'SELECT * FROM shifts WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  }

  /**
   * Get shifts by date
   */
  static async findByDate(scheduleId: string, date: string): Promise<ApiShift[]> {
    const result = await query<ApiShift>(
      'SELECT * FROM shifts WHERE schedule_id = $1 AND date = $2 ORDER BY type',
      [scheduleId, date]
    )
    return result.rows
  }

  /**
   * Create new shift
   */
  static async create(input: CreateShiftInput): Promise<ApiShift> {
    const result = await query<ApiShift>(
      `INSERT INTO shifts (schedule_id, date, type, start_time, end_time, required_staff)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.schedule_id,
        input.date,
        input.type,
        input.start_time,
        input.end_time,
        input.required_staff || 2
      ]
    )
    return result.rows[0]
  }

  /**
   * Create multiple shifts (bulk insert)
   */
  static async createMany(shifts: CreateShiftInput[]): Promise<ApiShift[]> {
    if (shifts.length === 0) return []

    const values: any[] = []
    const valuePlaceholders: string[] = []
    let paramIndex = 1

    for (const shift of shifts) {
      valuePlaceholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`
      )
      values.push(
        shift.schedule_id,
        shift.date,
        shift.type,
        shift.start_time,
        shift.end_time,
        shift.required_staff || 2
      )
      paramIndex += 6
    }

    const result = await query<ApiShift>(
      `INSERT INTO shifts (schedule_id, date, type, start_time, end_time, required_staff)
       VALUES ${valuePlaceholders.join(', ')}
       RETURNING *`,
      values
    )

    return result.rows
  }

  /**
   * Delete shift
   */
  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM shifts WHERE id = $1',
      [id]
    )
    return (result.rowCount || 0) > 0
  }

  /**
   * Delete all shifts for a schedule
   */
  static async deleteBySchedule(scheduleId: string): Promise<number> {
    const result = await query(
      'DELETE FROM shifts WHERE schedule_id = $1',
      [scheduleId]
    )
    return result.rowCount || 0
  }
}

// =============================================================================
// SHIFT ASSIGNMENTS
// =============================================================================

export class ShiftAssignmentModel {
  /**
   * Get all assignments for a shift
   */
  static async findByShift(shiftId: string): Promise<ApiShiftAssignment[]> {
    const result = await query<ApiShiftAssignment>(
      `SELECT
        sa.*,
        n.name as nurse_name,
        n.role as nurse_role
      FROM shift_assignments sa
      JOIN nurses n ON sa.nurse_id = n.id
      WHERE sa.shift_id = $1
      ORDER BY sa.assignment_role DESC, n.name`,
      [shiftId]
    )
    return result.rows
  }

  /**
   * Get all assignments for a nurse in a schedule
   */
  static async findByNurseInSchedule(
    nurseId: string,
    scheduleId: string
  ): Promise<ApiShiftAssignment[]> {
    const result = await query<ApiShiftAssignment>(
      `SELECT sa.*, n.name as nurse_name, n.role as nurse_role
       FROM shift_assignments sa
       JOIN nurses n ON sa.nurse_id = n.id
       JOIN shifts s ON sa.shift_id = s.id
       WHERE sa.nurse_id = $1 AND s.schedule_id = $2
       ORDER BY s.date`,
      [nurseId, scheduleId]
    )
    return result.rows
  }

  /**
   * Create assignment
   */
  static async create(
    shiftId: string,
    input: CreateAssignmentInput,
    assignedBy: 'algorithm' | 'manual' = 'manual'
  ): Promise<ApiShiftAssignment> {
    const result = await query<ApiShiftAssignment>(
      `INSERT INTO shift_assignments (shift_id, nurse_id, assigned_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [shiftId, input.nurse_id, assignedBy]
    )

    // Fetch with nurse details
    const assignments = await this.findByShift(shiftId)
    return assignments.find((a) => a.id === result.rows[0].id)!
  }

  /**
   * Create multiple assignments (bulk insert)
   */
  static async createMany(
    assignments: Array<{
      shift_id: string
      nurse_id: string
      assigned_by: 'algorithm' | 'manual'
    }>
  ): Promise<number> {
    if (assignments.length === 0) return 0

    const values: any[] = []
    const valuePlaceholders: string[] = []
    let paramIndex = 1

    for (const assignment of assignments) {
      valuePlaceholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`
      )
      values.push(assignment.shift_id, assignment.nurse_id, assignment.assigned_by)
      paramIndex += 3
    }

    const result = await query(
      `INSERT INTO shift_assignments (shift_id, nurse_id, assigned_by)
       VALUES ${valuePlaceholders.join(', ')}
       ON CONFLICT (shift_id, nurse_id) DO NOTHING`,
      values
    )

    return result.rowCount || 0
  }

  /**
   * Delete assignment
   */
  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM shift_assignments WHERE id = $1',
      [id]
    )
    return (result.rowCount || 0) > 0
  }

  /**
   * Delete all assignments for a shift
   */
  static async deleteByShift(shiftId: string): Promise<number> {
    const result = await query(
      'DELETE FROM shift_assignments WHERE shift_id = $1',
      [shiftId]
    )
    return result.rowCount || 0
  }

  /**
   * Check if nurse is already assigned to a shift on the same day
   */
  static async isNurseAssignedOnDate(
    nurseId: string,
    scheduleId: string,
    date: string
  ): Promise<boolean> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM shift_assignments sa
       JOIN shifts s ON sa.shift_id = s.id
       WHERE sa.nurse_id = $1
         AND s.schedule_id = $2
         AND s.date = $3`,
      [nurseId, scheduleId, date]
    )
    return parseInt(result.rows[0].count) > 0
  }

  /**
   * Get shift count for shift (staff + responsible)
   */
  static async getShiftCounts(shiftId: string): Promise<{
    staff_count: number
    responsible_count: number
  }> {
    const result = await query<any>(
      `SELECT
        COUNT(CASE WHEN assignment_role = 'staff' THEN 1 END)::INTEGER as staff_count,
        COUNT(CASE WHEN assignment_role = 'responsible' THEN 1 END)::INTEGER as responsible_count
       FROM shift_assignments
       WHERE shift_id = $1`,
      [shiftId]
    )
    return result.rows[0] || { staff_count: 0, responsible_count: 0 }
  }
}
