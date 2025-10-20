import { query } from '../db/connection.js'
import type {
  Schedule,
  CreateScheduleInput,
  UpdateScheduleInput,
  ScheduleDetail,
  DaySchedule,
  ShiftWithAssignments
} from '@shared/types/index.js'

export class ScheduleModel {
  /**
   * Get all schedules
   */
  static async findAll(): Promise<Schedule[]> {
    const result = await query<Schedule>(
      'SELECT * FROM schedules ORDER BY month DESC'
    )
    return result.rows
  }

  /**
   * Get schedule by ID
   */
  static async findById(id: string): Promise<Schedule | null> {
    const result = await query<Schedule>(
      'SELECT * FROM schedules WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  }

  /**
   * Get schedule by month (YYYY-MM-DD format)
   */
  static async findByMonth(month: string): Promise<Schedule | null> {
    const result = await query<Schedule>(
      'SELECT * FROM schedules WHERE month = $1',
      [month]
    )
    return result.rows[0] || null
  }

  /**
   * Get schedule detail with all shifts and assignments
   */
  static async findDetailById(id: string): Promise<ScheduleDetail | null> {
    const schedule = await this.findById(id)
    if (!schedule) return null

    // Get all shifts for this schedule
    const shiftsResult = await query<any>(
      `SELECT
        s.*,
        sc.current_staff,
        sc.current_responsible,
        sc.is_complete,
        sc.status_message
      FROM shifts s
      LEFT JOIN shift_completeness sc ON s.id = sc.shift_id
      WHERE s.schedule_id = $1
      ORDER BY s.date, s.type`,
      [id]
    )

    // Get all assignments
    const assignmentsResult = await query<any>(
      `SELECT
        sa.*,
        n.name as nurse_name,
        n.role as nurse_role
      FROM shift_assignments sa
      JOIN nurses n ON sa.nurse_id = n.id
      JOIN shifts s ON sa.shift_id = s.id
      WHERE s.schedule_id = $1`,
      [id]
    )

    // Group shifts by date
    const shiftsByDate = new Map<string, ShiftWithAssignments[]>()

    for (const shift of shiftsResult.rows) {
      const date = shift.date.toISOString().split('T')[0]
      if (!shiftsByDate.has(date)) {
        shiftsByDate.set(date, [])
      }

      const shiftAssignments = assignmentsResult.rows
        .filter((a: any) => a.shift_id === shift.id)
        .map((a: any) => ({
          id: a.id,
          shift_id: a.shift_id,
          nurse_id: a.nurse_id,
          nurse_name: a.nurse_name,
          nurse_role: a.nurse_role,
          assignment_role: a.assignment_role,
          assigned_by: a.assigned_by,
          created_at: a.created_at
        }))

      shiftsByDate.get(date)!.push({
        id: shift.id,
        schedule_id: shift.schedule_id,
        date: date,
        type: shift.type,
        start_time: shift.start_time,
        end_time: shift.end_time,
        required_staff: shift.required_staff,
        requires_responsible: shift.requires_responsible,
        created_at: shift.created_at,
        assignments: shiftAssignments,
        is_complete: shift.is_complete,
        current_staff: shift.current_staff,
        current_responsible: shift.current_responsible,
        status_message: shift.status_message
      })
    }

    // Build days array
    const days: DaySchedule[] = []
    const monthDate = new Date(schedule.month)
    const daysInMonth = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0
    ).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        day
      )
      const dateStr = date.toISOString().split('T')[0]
      const dayOfWeek = date.getDay()

      days.push({
        date: dateStr,
        is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
        is_holiday: false, // TODO: Holiday detection
        shifts: shiftsByDate.get(dateStr) || []
      })
    }

    // Calculate stats
    const totalShifts = shiftsResult.rows.length
    const completeShifts = shiftsResult.rows.filter((s: any) => s.is_complete).length

    return {
      ...schedule,
      days,
      stats: {
        total_days: daysInMonth,
        complete_shifts: completeShifts,
        incomplete_shifts: totalShifts - completeShifts
      }
    }
  }

  /**
   * Create new schedule
   */
  static async create(input: CreateScheduleInput): Promise<Schedule> {
    // Convert YYYY-MM to YYYY-MM-01
    const monthDate = `${input.month}-01`

    const result = await query<Schedule>(
      `INSERT INTO schedules (month, status)
       VALUES ($1, 'draft')
       RETURNING *`,
      [monthDate]
    )
    return result.rows[0]
  }

  /**
   * Update schedule
   */
  static async update(id: string, input: UpdateScheduleInput): Promise<Schedule | null> {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (input.status !== undefined) {
      updates.push(`status = $${paramIndex}`)
      values.push(input.status)
      paramIndex++
    }

    if (input.fairness_score !== undefined) {
      updates.push(`fairness_score = $${paramIndex}`)
      values.push(input.fairness_score)
      paramIndex++
    }

    if (updates.length === 0) {
      return this.findById(id)
    }

    values.push(id)
    const result = await query<Schedule>(
      `UPDATE schedules
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    )

    return result.rows[0] || null
  }

  /**
   * Delete schedule
   */
  static async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM schedules WHERE id = $1',
      [id]
    )
    return (result.rowCount || 0) > 0
  }

  /**
   * Check if schedule exists for month
   */
  static async existsForMonth(month: string): Promise<boolean> {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM schedules WHERE month = $1',
      [month]
    )
    return parseInt(result.rows[0].count) > 0
  }
}
