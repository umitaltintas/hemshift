import { Router, Request, Response, NextFunction } from 'express'
import { LeaveModel } from '../models/Leave.js'
import { NurseModel } from '../models/Nurse.js'
import { validate, validateUUID, createLeaveSchema, updateLeaveSchema } from '../middleware/validation.js'
import { NotFoundError } from '../middleware/errorHandler.js'

const router = Router()

/**
 * GET /api/leaves
 * Get all leaves with optional filters
 * Query params: nurse_id, month (YYYY-MM)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nurse_id, month } = req.query

    const leaves = await LeaveModel.findAll({
      nurse_id: nurse_id as string,
      month: month as string
    })

    res.json({
      success: true,
      data: leaves
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/leaves/:id
 * Get leave by ID
 */
router.get('/:id', validateUUID('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leave = await LeaveModel.findById(req.params.id)
    if (!leave) {
      throw new NotFoundError('İzin bulunamadı')
    }
    res.json({
      success: true,
      data: leave
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/leaves
 * Create new leave
 */
router.post('/', validate(createLeaveSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nurse_id, type, start_date, end_date, notes } = req.body

    // Check if nurse exists
    const nurse = await NurseModel.findById(nurse_id)
    if (!nurse) {
      throw new NotFoundError('Hemşire bulunamadı')
    }

    const leave = await LeaveModel.create({
      nurse_id,
      type,
      start_date,
      end_date,
      notes
    })

    res.status(201).json({
      success: true,
      data: leave,
      message: 'İzin başarıyla eklendi'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/leaves/:id
 * Update leave
 */
router.put(
  '/:id',
  validateUUID('id'),
  validate(updateLeaveSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const leave = await LeaveModel.findById(req.params.id)
      if (!leave) {
        throw new NotFoundError('İzin bulunamadı')
      }

      const updated = await LeaveModel.update(req.params.id, req.body)

      res.json({
        success: true,
        data: updated,
        message: 'İzin başarıyla güncellendi'
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * DELETE /api/leaves/:id
 * Delete leave
 */
router.delete('/:id', validateUUID('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leave = await LeaveModel.findById(req.params.id)
    if (!leave) {
      throw new NotFoundError('İzin bulunamadı')
    }

    const deleted = await LeaveModel.delete(req.params.id)
    if (!deleted) {
      throw new NotFoundError('İzin bulunamadı')
    }

    res.json({
      success: true,
      message: 'İzin başarıyla silindi'
    })
  } catch (error) {
    next(error)
  }
})

export default router
