import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    queryMock.mockResolvedValueOnce({ rows });

    const result = await LeaveModel.findAll();
    expect(result).toEqual(rows);
    expect(queryMock).toHaveBeenLastCalledWith(expect.stringContaining('FROM leaves'), []);

    queryMock.mockResolvedValueOnce({ rows });
    await LeaveModel.findAll({ nurse_id: 'n1', month: '2025-02' });
    const [, params] = queryMock.mock.calls.at(-1)!;
    expect(params).toEqual(['n1', '2025-02-01', '2025-02-27']);
  });

  it('retrieves single and ranged leaves', async () => {
    const leave = { id: 'l2' };
    queryMock.mockResolvedValueOnce({ rows: [leave] });
    const byId = await LeaveModel.findById('l2');
    expect(byId).toEqual(leave);

    queryMock.mockResolvedValueOnce({ rows: [leave] });
    const ranged = await LeaveModel.findByNurseAndDateRange('n2', '2025-03-01', '2025-03-15');
    expect(ranged).toEqual([leave]);
    expect(queryMock).toHaveBeenLastCalledWith(
      expect.stringContaining('FROM leaves l'),
      ['n2', '2025-03-01', '2025-03-15']
    );
  });

  it('checks leave status for a nurse', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ count: '1' }] });
    expect(await LeaveModel.isNurseOnLeave('n1', '2025-04-02')).toBe(true);

    queryMock.mockResolvedValueOnce({ rows: [{ count: '0' }] });
    expect(await LeaveModel.isNurseOnLeave('n1', '2025-04-03')).toBe(false);
  });

  it('creates, updates, and deletes leaves', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'l3' }] }); // insert result
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'l3', nurse_name: 'Alice' }] }); // findById
    const created = await LeaveModel.create({
      nurse_id: 'n3',
      type: 'annual',
      start_date: '2025-05-01',
      end_date: '2025-05-05',
      notes: 'Trip',
    });
    expect(created).toEqual({ id: 'l3', nurse_name: 'Alice' });

    queryMock.mockResolvedValueOnce({}); // update query
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'l3', type: 'sick' }] }); // findById after update
    const updated = await LeaveModel.update('l3', { type: 'sick' });
    expect(updated).toEqual({ id: 'l3', type: 'sick' });

    queryMock.mockResolvedValueOnce({ rows: [{ id: 'l3', type: 'annual' }] });
    const fallback = await LeaveModel.update('l3', {});
    expect(fallback).toEqual({ id: 'l3', type: 'annual' });

    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    expect(await LeaveModel.delete('l3')).toBe(true);
  });
});
