import { Request, Response, NextFunction } from 'express'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  details?: unknown
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || 500
  const code = err.code || 'INTERNAL_ERROR'

  console.error('[ERROR]', {
    message: err.message,
    code,
    stack: err.stack,
    url: req.url,
    method: req.method
  })

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message || 'Bir hata oluştu',
      details: process.env.NODE_ENV === 'development' ? err.details : undefined
    }
  })
}

export class AppError extends Error implements ApiError {
  statusCode: number
  code: string
  details?: unknown

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 409, 'CONFLICT', details)
  }
}
