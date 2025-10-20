import { Router, Request, Response, NextFunction } from 'express'
import { query } from '../db/connection.js'
import { validateUUID } from '../middleware/validation.js'
import { NotFoundError } from '../middleware/errorHandler.js'
import type { NurseMonthlyStats, MonthlyStatistics, FairnessScore } from '@shared/types/index.js'

const router = Router()

/**
 * GET /api/stats/monthly/:schedule_id
 * Get monthly statistics for a schedule
 */
router.get(
  '/monthly/:schedule_id',
  validateUUID('schedule_id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { schedule_id } = req.params

      // Check if schedule exists
      const scheduleResult = await query(
        'SELECT * FROM schedules WHERE id = $1',
        [schedule_id]
      )

      if (scheduleResult.rows.length === 0) {
        throw new NotFoundError('Plan bulunamadı')
      }

      const schedule = scheduleResult.rows[0]

      // Refresh materialized view
      await query('REFRESH MATERIALIZED VIEW nurse_monthly_stats')

      // Get nurse stats
      const statsResult = await query<NurseMonthlyStats>(
        `SELECT * FROM nurse_monthly_stats
         WHERE schedule_id = $1
         ORDER BY nurse_role DESC, nurse_name`,
        [schedule_id]
      )

      const nurseStats = statsResult.rows

      // Separate staff and responsible stats
      const staffStats = nurseStats.filter((s) => s.nurse_role === 'staff')
      const responsibleStats = nurseStats.filter((s) => s.nurse_role === 'responsible')

      // Calculate fairness score (only for staff)
      const fairnessResult = await query<FairnessScore>(
        'SELECT * FROM calculate_fairness_score($1)',
        [schedule_id]
      )

      const fairnessScore = fairnessResult.rows[0] || {
        overall: 0,
        hours_score: 0,
        nights_score: 0,
        weekends_score: 0,
        hours_std_dev: 0,
        nights_std_dev: 0,
        weekends_std_dev: 0
      }

      // Calculate averages (only for staff)
      const avgHours =
        staffStats.length > 0
          ? staffStats.reduce((sum, s) => sum + s.total_hours, 0) / staffStats.length
          : 0

      const avgNights =
        staffStats.length > 0
          ? staffStats.reduce((sum, s) => sum + s.night_shift_count, 0) / staffStats.length
          : 0

      const avgWeekends =
        staffStats.length > 0
          ? staffStats.reduce((sum, s) => sum + s.weekend_shift_count, 0) / staffStats.length
          : 0

      const response: MonthlyStatistics = {
        schedule_id,
        month: schedule.month,
        fairness_score: {
          overall: fairnessScore.fairness_score || 0,
          hours_score: fairnessScore.hours_score || 0,
          nights_score: fairnessScore.nights_score || 0,
          weekends_score: fairnessScore.weekends_score || 0,
          hours_std_dev: fairnessScore.hours_std_dev || 0,
          nights_std_dev: fairnessScore.nights_std_dev || 0,
          weekends_std_dev: fairnessScore.weekends_std_dev || 0
        },
        nurses: nurseStats,
        averages: {
          staff_avg_hours: Math.round(avgHours * 100) / 100,
          staff_avg_nights: Math.round(avgNights * 100) / 100,
          staff_avg_weekends: Math.round(avgWeekends * 100) / 100
        }
      }

      res.json({
        success: true,
        data: response
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/stats/nurse/:nurse_id/schedule/:schedule_id
 * Get detailed stats for a specific nurse in a schedule
 */
router.get(
  '/nurse/:nurse_id/schedule/:schedule_id',
  validateUUID('nurse_id'),
  validateUUID('schedule_id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nurse_id, schedule_id } = req.params

      // Refresh materialized view
      await query('REFRESH MATERIALIZED VIEW nurse_monthly_stats')

      // Get nurse stats
      const statsResult = await query<NurseMonthlyStats>(
        `SELECT * FROM nurse_monthly_stats
         WHERE nurse_id = $1 AND schedule_id = $2`,
        [nurse_id, schedule_id]
      )

      if (statsResult.rows.length === 0) {
        throw new NotFoundError('İstatistik bulunamadı')
      }

      // Get detailed shift assignments
      const assignmentsResult = await query(
        `SELECT
          s.date,
          s.type,
          s.start_time,
          s.end_time,
          sa.assignment_role,
          CASE
            WHEN s.type = 'day_8h' THEN 8
            WHEN s.type = 'night_16h' THEN 16
            WHEN s.type = 'weekend_24h' THEN 24
          END as hours
         FROM shift_assignments sa
         JOIN shifts s ON sa.shift_id = s.id
         WHERE sa.nurse_id = $1 AND s.schedule_id = $2
         ORDER BY s.date`,
        [nurse_id, schedule_id]
      )

      res.json({
        success: true,
        data: {
          summary: statsResult.rows[0],
          assignments: assignmentsResult.rows
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
