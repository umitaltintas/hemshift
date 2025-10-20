import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

const makeRouter = (label: string) => {
  const router = express.Router();
  router.get('/', (_req, res) => res.json({ label }));
  return router;
};

describe('server bootstrap', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(express.application, 'listen').mockReturnValue({
      close: vi.fn(),
    } as unknown as ReturnType<typeof express.application.listen>);
  });

  afterEach(() => {
    vi.resetModules();
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

  it('honors custom PORT environment variable', async () => {
    try {
      process.env.PORT = '9090';
      const listenSpy = vi
        .spyOn(express.application, 'listen')
        .mockReturnValue({ close: vi.fn() } as unknown as ReturnType<typeof express.application.listen>);

      const { default: app } = await import('../server');
      expect(listenSpy).toHaveBeenCalledWith('9090', expect.any(Function));

      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    } finally {
      delete process.env.PORT;
    }
  });

  it('loads env config and mounts all feature routers', async () => {
    delete process.env.PORT;

    const configSpy = vi.fn();
    vi.doMock('dotenv', () => ({
      default: { config: configSpy },
    }));

    vi.doMock('../routes/nurses.js', () => ({ default: makeRouter('nurses') }));
    vi.doMock('../routes/leaves.js', () => ({ default: makeRouter('leaves') }));
    vi.doMock('../routes/schedules.js', () => ({ default: makeRouter('schedules') }));
    vi.doMock('../routes/shifts.js', () => ({ default: makeRouter('shifts') }));
    vi.doMock('../routes/stats.js', () => ({ default: makeRouter('stats') }));

    const listenSpy = vi
      .spyOn(express.application, 'listen')
      .mockReturnValue({ close: vi.fn() } as unknown as ReturnType<typeof express.application.listen>);

    const { default: app } = await import('../server');

    expect(configSpy).toHaveBeenCalledOnce();
    expect(listenSpy).toHaveBeenCalledWith(8080, expect.any(Function));

    const routes = [
      { path: '/api/nurses', label: 'nurses' },
      { path: '/api/leaves', label: 'leaves' },
      { path: '/api/schedules', label: 'schedules' },
      { path: '/api/shifts', label: 'shifts' },
      { path: '/api/stats', label: 'stats' },
    ];

    for (const route of routes) {
      const response = await request(app).get(route.path);
      expect(response.status).toBe(200);
      expect(response.body.label).toBe(route.label);
    }
  });
});
