import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import {
  AppError,
  ConflictError,
  ValidationError,
  errorHandler,
} from '../../middleware/errorHandler';

const originalEnv = { ...process.env };

const createMocks = () => {
  const req = {
    url: '/api/example',
    method: 'GET',
  } as Partial<Request>;

  const json = vi.fn();
  const status = vi.fn(() => ({ json }));

  const res = {
    status,
  } as unknown as Response;

  const next = vi.fn() as NextFunction;

  return { req, res, next, json, status };
};

describe('errorHandler middleware', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'production' };
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
    process.env = { ...originalEnv };
  });

  it('responds with defaults for unknown errors', () => {
    const err = new Error('Unexpected');
    const { req, res, json, status } = createMocks();

    errorHandler(err, req as Request, res, vi.fn());

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unexpected',
        details: undefined,
      },
    });
    expect(errorSpy).toHaveBeenCalledWith(
      '[ERROR]',
      expect.objectContaining({
        message: 'Unexpected',
        code: 'INTERNAL_ERROR',
        url: '/api/example',
        method: 'GET',
      })
    );
  });

  it('exposes details for known errors in development', () => {
    process.env.NODE_ENV = 'development';
    const err = new ValidationError('Invalid payload', { field: 'name' });
    const { req, res, json, status } = createMocks();

    errorHandler(err, req as Request, res, vi.fn());

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid payload',
        details: { field: 'name' },
      },
    });
  });
});

describe('custom error classes', () => {
  it('AppError stores metadata', () => {
    const err = new AppError('Teapot', 418, 'I_AM_A_TEAPOT', { tea: true });
    expect(err.statusCode).toBe(418);
    expect(err.code).toBe('I_AM_A_TEAPOT');
    expect(err.details).toEqual({ tea: true });
  });

  it('ConflictError sets defaults and optional details', () => {
    const err = new ConflictError('Already exists', { id: '123' });
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
    expect(err.details).toEqual({ id: '123' });
  });
});
