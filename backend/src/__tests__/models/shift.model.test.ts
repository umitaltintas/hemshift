import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryResult } from '../testUtils';

vi.mock('../../db/connection.js', () => ({
  query: vi.fn(),
}));

import { query } from '../../db/connection.js';
import { ShiftModel, ShiftAssignmentModel } from '../../models/Shift';

const queryMock = vi.mocked(query);

describe('ShiftModel', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('fetches shifts and performs basic mutations', async () => {
    const shift = { id: 'shift1' };

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [shift] }));
    expect(await ShiftModel.findBySchedule('s1')).toEqual([shift]);
    expect(queryMock).toHaveBeenLastCalledWith(
      'SELECT * FROM shifts WHERE schedule_id = $1 ORDER BY date, type',
      ['s1']
    );

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [shift] }));
    expect(await ShiftModel.findById('shift1')).toEqual(shift);

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [shift] }));
    expect(await ShiftModel.findByDate('s1', '2025-08-12')).toEqual([shift]);

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [shift] }));
    expect(
      await ShiftModel.create({
        schedule_id: 's1',
        date: '2025-08-12',
        type: 'day_8h',
        start_time: '08:00',
        end_time: '16:00',
      })
    ).toEqual(shift);

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [shift] }));
    expect(
      await ShiftModel.createMany([
        {
          schedule_id: 's1',
          date: '2025-08-12',
          type: 'day_8h',
          start_time: '08:00',
          end_time: '16:00',
        },
      ])
    ).toEqual([shift]);

    queryMock.mockResolvedValueOnce(createQueryResult({ rowCount: 1 }));
    expect(await ShiftModel.delete('shift1')).toBe(true);

    queryMock.mockResolvedValueOnce(createQueryResult({ rowCount: 2 }));
    expect(await ShiftModel.deleteBySchedule('s1')).toBe(2);
  });

  it('handles shift assignments lifecycle and queries', async () => {
    const assignment = {
      id: 'assign1',
      shift_id: 'shift1',
      nurse_id: 'n1',
      nurse_name: 'Alice',
      nurse_role: 'staff',
    };

    queryMock.mockResolvedValueOnce({ rows: [assignment] });
    expect(await ShiftAssignmentModel.findByShift('shift1')).toEqual([assignment]);

    queryMock.mockResolvedValueOnce({ rows: [assignment] });
    expect(await ShiftAssignmentModel.findByNurseInSchedule('n1', 's1')).toEqual([assignment]);

    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 'assign1' }] }) // insert
      .mockResolvedValueOnce({ rows: [assignment] }); // fetch by shift
    expect(
      await ShiftAssignmentModel.create('shift1', { nurse_id: 'n1' }, 'algorithm')
    ).toEqual(assignment);

    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    expect(
      await ShiftAssignmentModel.createMany([
        { shift_id: 'shift1', nurse_id: 'n1', assigned_by: 'manual' },
      ])
    ).toBe(1);

    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    expect(await ShiftAssignmentModel.delete('assign1')).toBe(true);

    queryMock.mockResolvedValueOnce({ rowCount: 2 });
    expect(await ShiftAssignmentModel.deleteByShift('shift1')).toBe(2);

    queryMock.mockResolvedValueOnce({ rows: [{ count: '1' }] });
    expect(await ShiftAssignmentModel.isNurseAssignedOnDate('n1', 's1', '2025-08-12')).toBe(true);

    queryMock.mockResolvedValueOnce({
      rows: [{ staff_count: 2, responsible_count: 1 }],
    });
    expect(await ShiftAssignmentModel.getShiftCounts('shift1')).toEqual({
      staff_count: 2,
      responsible_count: 1,
    });
  });

  it('covers optional values and early-return branches', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'shift2', required_staff: 4 }] });
    await ShiftModel.create({
      schedule_id: 's1',
      date: '2025-08-13',
      type: 'night_16h',
      start_time: '16:00',
      end_time: '08:00',
      required_staff: 4,
    });
    const createArgs = queryMock.mock.calls.at(-1)!;
    expect(createArgs[1][5]).toBe(4);

    queryMock.mockResolvedValueOnce({ rows: [{ id: 'shift-bulk' }] });
    await ShiftModel.createMany([
      {
        schedule_id: 's1',
        date: '2025-08-14',
        type: 'day_8h',
        start_time: '08:00',
        end_time: '16:00',
        required_staff: 3,
      },
    ]);
    const bulkArgs = queryMock.mock.calls.at(-1)!;
    expect(bulkArgs[1][5]).toBe(3);

    const callsBeforeEmptyBulk = queryMock.mock.calls.length;
    expect(await ShiftModel.createMany([])).toEqual([]);
    expect(queryMock.mock.calls.length).toBe(callsBeforeEmptyBulk);

    queryMock.mockResolvedValueOnce({ rowCount: 0 });
    expect(await ShiftModel.delete('ghost-shift')).toBe(false);

    queryMock.mockResolvedValueOnce({ rowCount: 0 });
    expect(await ShiftModel.deleteBySchedule('ghost-sched')).toBe(0);

    queryMock.mockResolvedValueOnce({ rows: [{ id: 'assign2' }] });
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 'assign2',
          shift_id: 'shift2',
          nurse_id: 'n2',
          nurse_name: 'Ben',
          nurse_role: 'staff',
          assignment_role: 'staff',
          assigned_by: 'manual',
          created_at: '2025-08-14',
        },
      ],
    });
    const manualAssignment = await ShiftAssignmentModel.create('shift2', { nurse_id: 'n2' });
    expect(manualAssignment.assigned_by).toBe('manual');

    const callsBeforeEmptyAssignments = queryMock.mock.calls.length;
    expect(await ShiftAssignmentModel.createMany([])).toBe(0);
    expect(queryMock.mock.calls.length).toBe(callsBeforeEmptyAssignments);

    queryMock.mockResolvedValueOnce({});
    expect(
      await ShiftAssignmentModel.createMany([
        { shift_id: 'shift2', nurse_id: 'n3', assigned_by: 'manual' },
      ])
    ).toBe(0);

    queryMock.mockResolvedValueOnce({ rows: [{ count: '0' }] });
    expect(await ShiftAssignmentModel.isNurseAssignedOnDate('n2', 's1', '2025-08-14')).toBe(false);

    queryMock.mockResolvedValueOnce({ rows: [] });
    expect(await ShiftAssignmentModel.getShiftCounts('shift2')).toEqual({
      staff_count: 0,
      responsible_count: 0,
    });

    queryMock.mockResolvedValueOnce({ rowCount: 0 });
    expect(await ShiftAssignmentModel.delete('ghost-assignment')).toBe(false);

    queryMock.mockResolvedValueOnce({ rowCount: 0 });
    expect(await ShiftAssignmentModel.deleteByShift('ghost-shift')).toBe(0);

    queryMock.mockResolvedValueOnce({ rows: [] });
    expect(await ShiftModel.findById('missing')).toBeNull();
  });
});
