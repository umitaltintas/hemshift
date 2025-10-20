import { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'
import { ValidationError } from './errorHandler.js'

/**
 * Validation middleware factory
 */
export function validate(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors
          ? error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          : error.message
        next(new ValidationError('Girdi doğrulama hatası', details))
      } else {
        next(error)
      }
    }
  }
}

/**
 * UUID validation
 */
export function validateUUID(paramName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const id = req.params[paramName]

    if (!id || !uuidRegex.test(id)) {
      return next(new ValidationError(`Geçersiz ${paramName}`))
    }

    next()
  }
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

// Nurse Schemas
export const createNurseSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalı').max(255),
  role: z.enum(['responsible', 'staff'], {
    errorMap: () => ({ message: "Rol 'responsible' veya 'staff' olmalı" })
  })
})

export const updateNurseSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalı').max(255).optional()
})

// Leave Schemas
export const createLeaveSchema = z.object({
  nurse_id: z.string().uuid('Geçersiz hemşire ID'),
  type: z.enum(['annual', 'excuse', 'sick', 'preference'], {
    errorMap: () => ({ message: "İzin tipi geçersiz" })
  }),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçersiz tarih formatı (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçersiz tarih formatı (YYYY-MM-DD)'),
  notes: z.string().optional()
}).refine(data => {
  const start = new Date(data.start_date)
  const end = new Date(data.end_date)
  return end >= start
}, {
  message: 'Bitiş tarihi başlangıç tarihinden önce olamaz',
  path: ['end_date']
})

export const updateLeaveSchema = z.object({
  type: z.enum(['annual', 'excuse', 'sick', 'preference']).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional()
})

// Schedule Schemas
export const generateScheduleSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Geçersiz ay formatı (YYYY-MM)')
})

export const updateScheduleSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  fairness_score: z.number().min(0).max(100).optional()
})

// Shift Schemas
export const createShiftSchema = z.object({
  schedule_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['day_8h', 'night_16h', 'weekend_24h']),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  required_staff: z.number().int().min(1).optional()
})

// Assignment Schemas
export const createAssignmentSchema = z.object({
  nurse_id: z.string().uuid('Geçersiz hemşire ID')
})
