import { Router, Request, Response, NextFunction } from 'express'
import { ShiftModel, ShiftAssignmentModel } from '../models/Shift.js'
import { NurseModel } from '../models/Nurse.js'
import { LeaveModel } from '../models/Leave.js'
import {
  validate,
  validateUUID,
  createAssignmentSchema
} from '../middleware/validation.js'
import { NotFoundError, ConflictError } from '../middleware/errorHandler.js'

const router = Router()

/**
 * GET /api/shifts
 * Get shifts with optional filters
 * Query params: schedule_id (required), date (optional)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { schedule_id, date } = req.query

    if (!schedule_id) {
      throw new NotFoundError('schedule_id parametresi gerekli')
    }

    let shifts
    if (date) {
      shifts = await ShiftModel.findByDate(schedule_id as string, date as string)
    } else {
      shifts = await ShiftModel.findBySchedule(schedule_id as string)
    }

    // Get assignments for each shift
    const shiftsWithAssignments = await Promise.all(
      shifts.map(async (shift) => {
        const assignments = await ShiftAssignmentModel.findByShift(shift.id)
        const counts = await ShiftAssignmentModel.getShiftCounts(shift.id)

        return {
          ...shift,
          assignments,
          current_staff: counts.staff_count,
          current_responsible: counts.responsible_count,
          is_complete:
            (shift.requires_responsible ? counts.responsible_count > 0 : true) &&
            counts.staff_count >= shift.required_staff
        }
      })
    )

    res.json({
      success: true,
      data: shiftsWithAssignments
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/shifts/:id
 * Get shift by ID with assignments
 */
router.get(
  '/:id',
  validateUUID('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const shift = await ShiftModel.findById(req.params.id)
      if (!shift) {
        throw new NotFoundError('Vardiya bulunamadı')
      }

      const assignments = await ShiftAssignmentModel.findByShift(shift.id)
      const counts = await ShiftAssignmentModel.getShiftCounts(shift.id)

      res.json({
        success: true,
        data: {
          ...shift,
          assignments,
          current_staff: counts.staff_count,
          current_responsible: counts.responsible_count
        }
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * POST /api/shifts/:shift_id/assign
 * Assign nurse to shift
 */
router.post(
  '/:shift_id/assign',
  validateUUID('shift_id'),
  validate(createAssignmentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { shift_id } = req.params
      const { nurse_id } = req.body

      // 1. Check if shift exists
      const shift = await ShiftModel.findById(shift_id)
      if (!shift) {
        throw new NotFoundError('Vardiya bulunamadı')
      }

      // 2. Check if nurse exists
      const nurse = await NurseModel.findById(nurse_id)
      if (!nurse) {
        throw new NotFoundError('Hemşire bulunamadı')
      }

      // 3. Check if nurse is on leave
      const isOnLeave = await LeaveModel.isNurseOnLeave(nurse_id, shift.date)
      if (isOnLeave) {
        throw new ConflictError('Hemşire bu tarihte izinde')
      }

      // 4. Check if nurse already assigned on same date
      const alreadyAssigned = await ShiftAssignmentModel.isNurseAssignedOnDate(
        nurse_id,
        shift.schedule_id,
        shift.date
      )
      if (alreadyAssigned) {
        throw new ConflictError('Hemşire bu günde zaten başka bir vardiyaya atanmış')
      }

      // 5. Validate responsible nurse can only work day shifts
      if (nurse.role === 'responsible' && shift.type !== 'day_8h') {
        throw new ConflictError(
          'Sorumlu hemşire sadece 8 saatlik gündüz vardiyasında çalışabilir'
        )
      }

      // 6. Check shift capacity
      const counts = await ShiftAssignmentModel.getShiftCounts(shift_id)

      if (nurse.role === 'responsible') {
        if (counts.responsible_count >= 1) {
          throw new ConflictError('Bu vardiyada zaten sorumlu hemşire var')
        }
      } else {
        // Staff nurse
        if (counts.staff_count >= shift.required_staff) {
          throw new ConflictError(
            `Bu vardiyada maksimum staf sayısına ulaşıldı (${shift.required_staff})`
          )
        }
      }

      // 7. Create assignment
      const assignment = await ShiftAssignmentModel.create(
        shift_id,
        { nurse_id },
        'manual'
      )

      res.status(201).json({
        success: true,
        data: assignment,
        message: 'Hemşire vardiyaya başarıyla atandı'
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * DELETE /api/assignments/:id
 * Remove nurse from shift
 */
router.delete(
  '/assignments/:id',
  validateUUID('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await ShiftAssignmentModel.delete(req.params.id)
      if (!deleted) {
        throw new NotFoundError('Atama bulunamadı')
      }

      res.json({
        success: true,
        message: 'Atama başarıyla kaldırıldı'
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
