import { Router, Request, Response, NextFunction } from 'express'
import { ScheduleModel } from '../models/Schedule.js'
import { SchedulerService } from '../services/scheduler.service.js'
import {
  validate,
  validateUUID,
  generateScheduleSchema,
  updateScheduleSchema
} from '../middleware/validation.js'
import { NotFoundError, ConflictError } from '../middleware/errorHandler.js'

const router: Router = Router()

/**
 * GET /api/schedules
 * Get all schedules
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const schedules = await ScheduleModel.findAll()
    res.json({
      success: true,
      data: schedules
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/schedules/:month
 * Get schedule by month (YYYY-MM format)
 */
router.get('/:month', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const month = req.params.month

    // Validate format YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new NotFoundError('Geçersiz ay formatı (YYYY-MM bekleniyor)')
    }

    const monthDate = `${month}-01`
    const schedule = await ScheduleModel.findByMonth(monthDate)

    if (!schedule) {
      throw new NotFoundError('Bu ay için plan bulunamadı')
    }

    // Get full detail with shifts and assignments
    const detail = await ScheduleModel.findDetailById(schedule.id)

    res.json({
      success: true,
      data: detail
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/schedules/generate
 * Generate automatic schedule for a month
 */
router.post(
  '/generate',
  validate(generateScheduleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { month } = req.body // YYYY-MM format
      const monthDate = `${month}-01`

      // Check if schedule already exists
      const exists = await ScheduleModel.existsForMonth(monthDate)
      if (exists) {
        throw new ConflictError('Bu ay için plan zaten mevcut')
      }

      // Create schedule
      const schedule = await ScheduleModel.create({ month })

      console.log(`[API] Generating schedule for ${month}...`)

      // Generate schedule using the scheduler service
      const scheduler = new SchedulerService()
      const result = await scheduler.generateSchedule(schedule.id, month)

      console.log(`[API] Schedule generated successfully`)

      res.status(201).json({
        success: true,
        data: {
          id: schedule.id,
          month: schedule.month,
          status: 'draft',
          fairness_score: result.fairness_score,
          shifts: result.shifts,
          assignments: result.assignments,
          warnings: result.warnings,
          generation_time_ms: result.generation_time_ms
        },
        message: 'Plan başarıyla oluşturuldu'
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * PUT /api/schedules/:id
 * Update schedule (status, fairness_score)
 */
router.put(
  '/:id',
  validateUUID('id'),
  validate(updateScheduleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schedule = await ScheduleModel.findById(req.params.id)
      if (!schedule) {
        throw new NotFoundError('Plan bulunamadı')
      }

      const updated = await ScheduleModel.update(req.params.id, req.body)

      res.json({
        success: true,
        data: updated,
        message: 'Plan başarıyla güncellendi'
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/schedules/:id/publish
 * Publish schedule (change status from draft to published)
 */
router.post(
  '/:id/publish',
  validateUUID('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schedule = await ScheduleModel.findById(req.params.id)
      if (!schedule) {
        throw new NotFoundError('Plan bulunamadı')
      }

      if (schedule.status === 'published') {
        throw new ConflictError('Plan zaten yayınlanmış')
      }

      const updated = await ScheduleModel.update(req.params.id, {
        status: 'published'
      })

      res.json({
        success: true,
        data: updated,
        message: 'Plan başarıyla yayınlandı'
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/schedules/:id/validate
 * Validate schedule - check if all shifts are properly filled
 */
router.post(
  '/:id/validate',
  validateUUID('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schedule = await ScheduleModel.findById(req.params.id)
      if (!schedule) {
        throw new NotFoundError('Plan bulunamadı')
      }

      const detail = await ScheduleModel.findDetailById(req.params.id)
      if (!detail) {
        throw new NotFoundError('Plan detayları bulunamadı')
      }

      // Validate all shifts
      const validation = {
        total_shifts: 0,
        complete_shifts: 0,
        incomplete_shifts: 0,
        issues: [] as string[]
      }

      for (const day of detail.days) {
        for (const shift of day.shifts) {
          validation.total_shifts++

          if (shift.is_complete) {
            validation.complete_shifts++
          } else {
            validation.incomplete_shifts++

            // Build issue description
            const currentStaff = shift.current_staff || 0
            const requiredStaff = shift.required_staff
            const missing = requiredStaff - currentStaff

            let issue = `${day.date} - ${shift.type}: ${missing} hemşire eksik`

            if (shift.requires_responsible && !shift.current_responsible) {
              issue += ' (sorumlu hemşire gerekli)'
            }

            validation.issues.push(issue)
          }
        }
      }

      const is_valid = validation.incomplete_shifts === 0

      res.json({
        success: true,
        data: {
          schedule_id: schedule.id,
          is_valid,
          validation
        },
        message: is_valid ? 'Plan tamamen doldurulmuş' : `${validation.incomplete_shifts} eksik vardiya bulundu`
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/schedules/:id/export/excel
 * Export schedule as Excel file (JSON format compatible with xlsx)
 */
router.get(
  '/:id/export/excel',
  validateUUID('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schedule = await ScheduleModel.findById(req.params.id)
      if (!schedule) {
        throw new NotFoundError('Plan bulunamadı')
      }

      const detail = await ScheduleModel.findDetailById(req.params.id)
      if (!detail) {
        throw new NotFoundError('Plan detayları bulunamadı')
      }

      // Generate Excel data structure - flat format suitable for conversion to XLSX
      const sheetRows = []

      // Add summary row
      sheetRows.push({
        'Ay': new Date(schedule.month).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
        'Durum': schedule.status,
        'Adillik Puanı': schedule.fairness_score || '-',
        'Tamamlanan Vardiyalar': detail.stats.complete_shifts,
        'Tamamlanmamış Vardiyalar': detail.stats.incomplete_shifts
      })

      sheetRows.push({}) // Empty row

      // Add shifts
      sheetRows.push({
        'Tarih': 'Tarih',
        'Vardiya Türü': 'Vardiya Türü',
        'Başlama': 'Başlama',
        'Bitiş': 'Bitiş',
        'Gerekli': 'Gerekli',
        'Atanan': 'Atanan',
        'Hemşireler': 'Hemşireler'
      })

      for (const day of detail.days) {
        for (const shift of day.shifts) {
          const nurseNames = shift.assignments.map((a) => a.nurse_name).join('; ')

          sheetRows.push({
            'Tarih': day.date,
            'Vardiya Türü': shift.type,
            'Başlama': shift.start_time,
            'Bitiş': shift.end_time,
            'Gerekli': shift.required_staff,
            'Atanan': shift.current_staff || 0,
            'Hemşireler': nurseNames || '-'
          })
        }
      }

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/json')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="schedule-${schedule.month}.json"`
      )

      res.json({
        success: true,
        data: {
          schedule: {
            id: schedule.id,
            month: schedule.month,
            status: schedule.status,
            fairness_score: schedule.fairness_score
          },
          rows: sheetRows,
          stats: detail.stats
        },
        message: 'Excel verileri hazır'
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * GET /api/schedules/:id/export/csv
 * Export schedule as CSV file
 */
router.get(
  '/:id/export/csv',
  validateUUID('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schedule = await ScheduleModel.findById(req.params.id)
      if (!schedule) {
        throw new NotFoundError('Plan bulunamadı')
      }

      const detail = await ScheduleModel.findDetailById(req.params.id)
      if (!detail) {
        throw new NotFoundError('Plan detayları bulunamadı')
      }

      // Generate CSV format
      let csv = 'Tarih,Vardiya Türü,Başlama,Bitiş,Gerekli Hemşire,Atanan Hemşire,Hemşire Isimleri\n'

      for (const day of detail.days) {
        for (const shift of day.shifts) {
          const nurseNames = shift.assignments
            .map((a) => a.nurse_name)
            .join('; ')

          const row = [
            day.date,
            shift.type,
            shift.start_time,
            shift.end_time,
            shift.required_staff,
            shift.current_staff || 0,
            nurseNames || '-'
          ]

          csv += row.map((val) => `"${val}"`).join(',') + '\n'
        }
      }

      // Set response headers for file download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="schedule-${schedule.month}.csv"`
      )

      res.send(csv)
    } catch (error) {
      next(error)
    }
  }
)

/**
 * DELETE /api/schedules/:id
 * Delete schedule
 */
router.delete(
  '/:id',
  validateUUID('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schedule = await ScheduleModel.findById(req.params.id)
      if (!schedule) {
        throw new NotFoundError('Plan bulunamadı')
      }

      // Prevent deleting published schedules
      if (schedule.status === 'published') {
        throw new ConflictError(
          'Yayınlanmış plan silinemez. Önce arşivlemeniz gerekiyor.'
        )
      }

      const deleted = await ScheduleModel.delete(req.params.id)
      if (!deleted) {
        throw new NotFoundError('Plan bulunamadı')
      }

      res.json({
        success: true,
        message: 'Plan başarıyla silindi'
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
