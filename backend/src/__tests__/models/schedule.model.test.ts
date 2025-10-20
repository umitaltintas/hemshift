import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryResult } from '../testUtils';

vi.mock('../../db/connection.js', () => ({
  query: vi.fn(),
}));

import { query } from '../../db/connection.js';
import { ScheduleModel } from '../../models/Schedule';

const queryMock = vi.mocked(query);

describe('ScheduleModel', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('retrieves schedules by list, id, and month', async () => {
    const row = { id: 's1', month: '2025-06-01', status: 'draft' };

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [row] }));
    expect(await ScheduleModel.findAll()).toEqual([row]);

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [row] }));
    expect(await ScheduleModel.findById('s1')).toEqual(row);

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [row] }));
    expect(await ScheduleModel.findByMonth('2025-06-01')).toEqual(row);
  });

  it('builds a detailed schedule view with grouped shifts', async () => {
    const baseSchedule = { id: 's2', month: '2025-06-01', status: 'published' };
    const shiftDate = new Date('2025-06-02T00:00:00Z');
    const shifts = [
      {
        id: 'shift-1',
        schedule_id: 's2',
        date: shiftDate,
        type: 'day_8h',
        start_time: '08:00',
        end_time: '16:00',
        required_staff: 2,
        requires_responsible: true,
        created_at: shiftDate,
        is_complete: true,
        current_staff: 2,
        current_responsible: 1,
        status_message: 'ok',
      },
    ];
    const assignments = [
      {
        id: 'assign-1',
        shift_id: 'shift-1',
        nurse_id: 'n1',
        nurse_name: 'Alice',
        nurse_role: 'staff',
        assignment_role: 'staff',
        assigned_by: 'manual',
        created_at: shiftDate,
      },
    ];

    queryMock
      .mockResolvedValueOnce(createQueryResult({ rows: [baseSchedule] })) // findById
      .mockResolvedValueOnce(createQueryResult({ rows: shifts })) // shifts
      .mockResolvedValueOnce(createQueryResult({ rows: assignments })); // assignments

    const detail = await ScheduleModel.findDetailById('s2');
    expect(detail?.id).toBe('s2');
    const dayEntry = detail!.days.find((d) => d.date === '2025-06-02');
    expect(dayEntry?.shifts[0].assignments[0].nurse_name).toBe('Alice');
    expect(detail?.stats).toEqual({
      total_days: 30,
      complete_shifts: 1,
      incomplete_shifts: 0,
    });
  });

  it('creates, updates, deletes, and checks schedule existence', async () => {
    const createdRow = { id: 's3', month: '2025-07-01', status: 'draft' };
    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [createdRow] }));
    expect(
      await ScheduleModel.create({
        month: '2025-07',
      })
    ).toEqual(createdRow);

    const updatedRow = { id: 's3', status: 'archived' };
    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [updatedRow] }));
    expect(
      await ScheduleModel.update('s3', {
        status: 'archived',
        fairness_score: 90,
      })
    ).toEqual(updatedRow);

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [createdRow] }));
    expect(await ScheduleModel.update('s3', {})).toEqual(createdRow);

    queryMock.mockResolvedValueOnce(createQueryResult({ rowCount: 1 }));
    expect(await ScheduleModel.delete('s3')).toBe(true);

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [{ count: '1' }] }));
    expect(await ScheduleModel.existsForMonth('2025-07-01')).toBe(true);
  });

  it('returns null/false for missing datasets', async () => {
    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [] }));
    expect(await ScheduleModel.findById('missing')).toBeNull();

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [] }));
    expect(await ScheduleModel.findByMonth('2025-01-01')).toBeNull();

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [] }));
    expect(await ScheduleModel.findDetailById('missing')).toBeNull();

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [] }));
    expect(await ScheduleModel.update('s3', { status: 'draft' })).toBeNull();

    queryMock.mockResolvedValueOnce(createQueryResult({ rowCount: 0 }));
    expect(await ScheduleModel.delete('ghost')).toBe(false);

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [{ count: '0' }] }));
    expect(await ScheduleModel.existsForMonth('2025-08-01')).toBe(false);
  });
});
