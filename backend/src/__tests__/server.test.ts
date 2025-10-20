import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

describe('server bootstrap', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(express.application, 'listen').mockReturnValue({
      close: vi.fn(),
    } as unknown as ReturnType<typeof express.application.listen>);
  });

  it('exposes health and API info endpoints', async () => {
    const { default: app } = await import('../server');

    const health = await request(app).get('/health');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('OK');
    expect(typeof health.body.timestamp).toBe('string');

    const api = await request(app).get('/api');
    expect(api.status).toBe(200);
    expect(api.body.endpoints.nurses).toBe('/api/nurses');

    expect(express.application.listen).toHaveBeenCalled();
  });
});
