import { Router, Request, Response, NextFunction } from 'express'
import { NurseModel } from '../models/Nurse.js'
import { validate, validateUUID, createNurseSchema, updateNurseSchema } from '../middleware/validation.js'
import { NotFoundError, ConflictError } from '../middleware/errorHandler.js'

const router: Router = Router()

/**
 * GET /api/nurses
 * Get all nurses
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const nurses = await NurseModel.findAll()
    res.json({
      success: true,
      data: nurses
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/nurses/responsible
 * Get responsible nurse
 */
router.get('/responsible', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const nurse = await NurseModel.findResponsible()
    if (!nurse) {
      throw new NotFoundError('Sorumlu hemşire bulunamadı')
    }
    res.json({
      success: true,
      data: nurse
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/nurses/staff
 * Get all staff nurses
 */
router.get('/staff', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const nurses = await NurseModel.findStaff()
    res.json({
      success: true,
      data: nurses
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/nurses/:id
 * Get nurse by ID
 */
router.get('/:id', validateUUID('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nurse = await NurseModel.findById(req.params.id)
    if (!nurse) {
      throw new NotFoundError('Hemşire bulunamadı')
    }
    res.json({
      success: true,
      data: nurse
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/nurses
 * Create new nurse
 */
router.post('/', validate(createNurseSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, role } = req.body

    // Check if trying to create responsible nurse when one already exists
    if (role === 'responsible') {
      const hasResponsible = await NurseModel.hasResponsible()
      if (hasResponsible) {
        throw new ConflictError('Sistemde zaten bir sorumlu hemşire var')
      }
    }

    const nurse = await NurseModel.create({ name, role })

    res.status(201).json({
      success: true,
      data: nurse,
      message: 'Hemşire başarıyla eklendi'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/nurses/:id
 * Update nurse
 */
router.put(
  '/:id',
  validateUUID('id'),
  validate(updateNurseSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const nurse = await NurseModel.findById(req.params.id)
      if (!nurse) {
        throw new NotFoundError('Hemşire bulunamadı')
      }

      const updated = await NurseModel.update(req.params.id, req.body)

      res.json({
        success: true,
        data: updated,
        message: 'Hemşire başarıyla güncellendi'
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * DELETE /api/nurses/:id
 * Delete nurse
 */
router.delete('/:id', validateUUID('id'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nurse = await NurseModel.findById(req.params.id)
    if (!nurse) {
      throw new NotFoundError('Hemşire bulunamadı')
    }

    // Prevent deleting responsible nurse
    if (nurse.role === 'responsible') {
      throw new ConflictError('Sorumlu hemşire silinemez')
    }

    const deleted = await NurseModel.delete(req.params.id)
    if (!deleted) {
      throw new NotFoundError('Hemşire bulunamadı')
    }

    res.json({
      success: true,
      message: 'Hemşire başarıyla silindi'
    })
  } catch (error) {
    next(error)
  }
})

export default router
