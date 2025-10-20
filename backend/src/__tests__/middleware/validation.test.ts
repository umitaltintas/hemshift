import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { NextFunction, Request, Response } from 'express';

import {
  createLeaveSchema,
  createNurseSchema,
  validate,
  validateUUID,
} from '../../middleware/validation';
import { ValidationError } from '../../middleware/errorHandler';

const buildReq = (body: unknown = {}, params: Record<string, string> = {}) =>
  ({ body, params } as unknown as Request);

const noopRes = {} as Response;

describe('validation middleware', () => {
  it('parses and replaces request body when schema succeeds', async () => {
    const schema = createNurseSchema;
    const validator = validate(schema);
    const next = vi.fn<Parameters<NextFunction>, void>();

    const req = buildReq({ name: 'Ayşe', role: 'staff' });
    await validator(req, noopRes, next);

    expect(req.body).toEqual({ name: 'Ayşe', role: 'staff' });
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('wraps zod validation errors into ValidationError with fallback message', async () => {
    const schema = createNurseSchema;
    const validator = validate(schema);
    const next = vi.fn<Parameters<NextFunction>, void>();

    const req = buildReq({ name: 'A', role: 'manager' });
    await validator(req, noopRes, next);

    expect(next).toHaveBeenCalledOnce();
    const [err] = next.mock.calls[0];
    expect(err).toBeInstanceOf(ValidationError);
    expect(err?.details).toContain('name');
    expect(err?.message).toBe('Girdi doğrulama hatası');
  });

  it('maps zod issue details when available on the error', async () => {
    const issues = [
      {
        path: ['field'],
        message: 'Field is required',
      },
    ];
    const zodErr = new z.ZodError(issues as any);
    (zodErr as any).errors = issues;

    const schema = {
      parseAsync: vi.fn().mockRejectedValue(zodErr),
    } as unknown as z.ZodSchema;

    const validator = validate(schema);
    const next = vi.fn<Parameters<NextFunction>, void>();

    await validator(buildReq({}), noopRes, next);

    const [err] = next.mock.calls[0];
    expect(err).toBeInstanceOf(ValidationError);
    expect(err?.details).toEqual([{ field: 'field', message: 'Field is required' }]);
  });

  it('passes through non-zod errors untouched', async () => {
    const boom = new Error('boom');
    const schema = {
      parseAsync: vi.fn().mockRejectedValue(boom),
    } as unknown as z.ZodSchema;

    const validator = validate(schema);
    const next = vi.fn<Parameters<NextFunction>, void>();

    await validator(buildReq({}), noopRes, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(boom);
  });
});

describe('validateUUID helper', () => {
  it('allows valid UUID values', () => {
    const handler = validateUUID('id');
    const next = vi.fn<Parameters<NextFunction>, void>();

    handler(buildReq({}, { id: '123e4567-e89b-12d3-a456-426614174000' }), noopRes, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects missing or malformed UUID values', () => {
    const handler = validateUUID('id');
    const next = vi.fn<Parameters<NextFunction>, void>();

    handler(buildReq({}, { id: 'not-a-uuid' }), noopRes, next);
    const [err] = next.mock.calls.at(-1)!;
    expect(err).toBeInstanceOf(ValidationError);
    expect(err?.message).toBe('Geçersiz id');
  });
});

describe('createLeaveSchema', () => {
  it('enforces end date to be after or equal to start date', () => {
    const result = createLeaveSchema.safeParse({
      nurse_id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'annual',
      start_date: '2025-01-10',
      end_date: '2025-01-09',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join('.') === 'end_date');
      expect(issue?.message).toBe('Bitiş tarihi başlangıç tarihinden önce olamaz');
    }
  });
});
