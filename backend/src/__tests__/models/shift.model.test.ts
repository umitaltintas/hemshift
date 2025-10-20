import { beforeEach, describe, expect, it, vi } from 'vitest';

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

    queryMock.mockResolvedValueOnce({ rows: [shift] });
    expect(await ShiftModel.findBySchedule('s1')).toEqual([shift]);
    expect(queryMock).toHaveBeenLastCalledWith(
      'SELECT * FROM shifts WHERE schedule_id = $1 ORDER BY date, type',
      ['s1']
    );

    queryMock.mockResolvedValueOnce({ rows: [shift] });
    expect(await ShiftModel.findById('shift1')).toEqual(shift);

    queryMock.mockResolvedValueOnce({ rows: [shift] });
    expect(await ShiftModel.findByDate('s1', '2025-08-12')).toEqual([shift]);

    queryMock.mockResolvedValueOnce({ rows: [shift] });
    expect(
      await ShiftModel.create({
        schedule_id: 's1',
        date: '2025-08-12',
        type: 'day_8h',
        start_time: '08:00',
        end_time: '16:00',
      })
    ).toEqual(shift);

    queryMock.mockResolvedValueOnce({ rows: [shift] });
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

    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    expect(await ShiftModel.delete('shift1')).toBe(true);

    queryMock.mockResolvedValueOnce({ rowCount: 2 });
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
});
