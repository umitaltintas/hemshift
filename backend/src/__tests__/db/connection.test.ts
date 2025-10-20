import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

const setupMocks = (queryImpl: (...args: any[]) => any) => {
  const eventHandlers = new Map<string, (...args: any[]) => void>();

  const poolInstance = {
    query: vi.fn(queryImpl),
    on: vi.fn((event: string, handler: (...args: any[]) => void) => {
      eventHandlers.set(event, handler);
      return poolInstance;
    }),
  };

  const PoolMock = vi.fn(() => poolInstance);

  vi.doMock('dotenv', () => ({ __esModule: true, default: { config: vi.fn() } }));
  vi.doMock('pg', () => ({ __esModule: true, default: { Pool: PoolMock } }));

  return { poolInstance, PoolMock, eventHandlers };
};

describe('db/connection', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgres://example',
      NODE_ENV: 'test',
    };
  });

  afterEach(() => {
    vi.doUnmock('pg');
    vi.doUnmock('dotenv');
    vi.resetModules();
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it('initializes pool and logs successful queries', async () => {
    const { PoolMock, poolInstance, eventHandlers } = setupMocks(async () => ({
      rowCount: 1,
      rows: [],
    }));

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { pool, query } = await import('../../db/connection');

    expect(PoolMock).toHaveBeenCalledWith({
      connectionString: 'postgres://example',
      ssl: false,
    });
    expect(pool).toBe(poolInstance);
    expect(pool.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(pool.on).toHaveBeenCalledWith('error', expect.any(Function));

    await query('SELECT 1');

    expect(poolInstance.query).toHaveBeenCalledWith('SELECT 1', undefined);
    expect(logSpy).toHaveBeenCalledWith(
      '[QUERY]',
      expect.objectContaining({
        text: 'SELECT 1',
        rows: 1,
      })
    );
    expect(errorSpy).not.toHaveBeenCalled();

    eventHandlers.get('connect')?.();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Connected to PostgreSQL'));
  });

  it('logs and rethrows query errors', async () => {
    const failure = new Error('boom');
    const { PoolMock } = setupMocks(async () => {
      throw failure;
    });

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { query } = await import('../../db/connection');

    expect(PoolMock).toHaveBeenCalled();
    await expect(query('SELECT 1')).rejects.toThrow(failure);
    expect(errorSpy).toHaveBeenCalledWith(
      '[QUERY ERROR]',
      expect.objectContaining({ text: 'SELECT 1', error: failure })
    );
  });

  it('handles pool error events by logging and exiting', async () => {
    const { eventHandlers } = setupMocks(async () => ({ rows: [], rowCount: 0 }));

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit called');
    }) as any);

    await import('../../db/connection');

    const handler = eventHandlers.get('error');
    expect(handler).toBeDefined();

    const poolError = new Error('connection lost');
    await expect(async () => handler?.(poolError)).rejects.toThrow('exit called');
    expect(errorSpy).toHaveBeenCalledWith('❌ Unexpected database error:', poolError);
    expect(exitSpy).toHaveBeenCalledWith(-1);
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('[QUERY]'));
  });
});
