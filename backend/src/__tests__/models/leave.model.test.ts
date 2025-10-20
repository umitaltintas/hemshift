import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryResult } from '../testUtils';

vi.mock('../../db/connection.js', () => ({
  query: vi.fn(),
}));

import { query } from '../../db/connection.js';
import { LeaveModel } from '../../models/Leave';

const queryMock = vi.mocked(query);

describe('LeaveModel', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('lists leaves with optional filters', async () => {
    const rows = [{ id: 'l1' }];
    queryMock.mockResolvedValueOnce(createQueryResult({ rows }));

    const result = await LeaveModel.findAll();
    expect(result).toEqual(rows);
    expect(queryMock).toHaveBeenLastCalledWith(expect.stringContaining('FROM leaves'), []);

    queryMock.mockResolvedValueOnce(createQueryResult({ rows }));
    await LeaveModel.findAll({ nurse_id: 'n1', month: '2025-02' });
    const [, params] = queryMock.mock.calls.at(-1)!;
    expect(params).toEqual(['n1', '2025-02-01', '2025-02-27']);
  });

  it('retrieves single and ranged leaves', async () => {
    const leave = { id: 'l2' };
    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [leave] }));
    const byId = await LeaveModel.findById('l2');
    expect(byId).toEqual(leave);

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [leave] }));
    const ranged = await LeaveModel.findByNurseAndDateRange('n2', '2025-03-01', '2025-03-15');
    expect(ranged).toEqual([leave]);
    expect(queryMock).toHaveBeenLastCalledWith(
      expect.stringContaining('FROM leaves l'),
      ['n2', '2025-03-01', '2025-03-15']
    );
  });

  it('checks leave status for a nurse', async () => {
    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [{ count: '1' }] }));
    expect(await LeaveModel.isNurseOnLeave('n1', '2025-04-02')).toBe(true);

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [{ count: '0' }] }));
    expect(await LeaveModel.isNurseOnLeave('n1', '2025-04-03')).toBe(false);
  });

  it('creates, updates, and deletes leaves', async () => {
    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [{ id: 'l3' }] })); // insert result
    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [{ id: 'l3', nurse_name: 'Alice' }] })); // findById
    const created = await LeaveModel.create({
      nurse_id: 'n3',
      type: 'annual',
      start_date: '2025-05-01',
      end_date: '2025-05-05',
      notes: 'Trip',
    });
    expect(created).toEqual({ id: 'l3', nurse_name: 'Alice' });

    queryMock.mockResolvedValueOnce(createQueryResult()); // update query
    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [{ id: 'l3', type: 'sick' }] })); // findById after update
    const updated = await LeaveModel.update('l3', { type: 'sick' });
    expect(updated).toEqual({ id: 'l3', type: 'sick' });

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [{ id: 'l3', type: 'annual' }] }));
    const fallback = await LeaveModel.update('l3', {});
    expect(fallback).toEqual({ id: 'l3', type: 'annual' });

    queryMock.mockResolvedValueOnce(createQueryResult({ rowCount: 1 }));
    expect(await LeaveModel.delete('l3')).toBe(true);
  });

  it('handles optional filters, updates, and fallbacks', async () => {
    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [] })); // findAll month-only
    await LeaveModel.findAll({ month: '2025-07' });
    const [, monthParams] = queryMock.mock.calls.at(-1)!;
    expect(monthParams?.[0]).toBe('2025-07-01');
    expect(monthParams?.[1]).toMatch(/^2025-07-3[01]$/);

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [] })); // findById null
    const missing = await LeaveModel.findById('missing');
    expect(missing).toBeNull();

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [{ count: '0' }] })); // isNurseOnLeave false branch
    expect(await LeaveModel.isNurseOnLeave('n4', '2025-08-01')).toBe(false);

    queryMock.mockResolvedValueOnce(createQueryResult()); // update multi-field
    queryMock.mockResolvedValueOnce(createQueryResult({
      rows: [{
        id: 'l5',
        type: 'sick',
        start_date: '2025-09-02',
        end_date: '2025-09-05',
        notes: 'Updated',
      }],
    }));
    const complexUpdate = await LeaveModel.update('l5', {
      type: 'sick',
      start_date: '2025-09-02',
      end_date: '2025-09-05',
      notes: 'Updated',
    });
    expect(complexUpdate).toEqual({
      id: 'l5',
      type: 'sick',
      start_date: '2025-09-02',
      end_date: '2025-09-05',
      notes: 'Updated',
    });
    const [updateSql, updateParams] = queryMock.mock.calls.at(-2)!;
    expect(updateSql).toContain('UPDATE leaves');
    expect(updateParams).toEqual([
      'sick',
      '2025-09-02',
      '2025-09-05',
      'Updated',
      'l5',
    ]);

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [] })); // update returns null
    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [] })); // findById after null update
    const updateNull = await LeaveModel.update('l6', { type: 'annual' });
    expect(updateNull).toBeNull();

    queryMock.mockResolvedValueOnce(createQueryResult({ rowCount: 0 })); // delete false branch
    expect(await LeaveModel.delete('missing')).toBe(false);
  });
});
