import { Router, Request, Response, NextFunction } from 'express'
import { ScheduleModel } from '../models/Schedule.js'
import { ShiftModel } from '../models/Shift.js'
import { SchedulerService } from '../services/scheduler.service.js'
import {
  validate,
  validateUUID,
  generateScheduleSchema,
  updateScheduleSchema
} from '../middleware/validation.js'
import { NotFoundError, ConflictError } from '../middleware/errorHandler.js'

const router = Router()

/**
 * GET /api/schedules
 * Get all schedules
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
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
