import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryResult } from '../testUtils';
import app from '../../server';
import { query } from '../../db/connection';

vi.mock('../../db/connection', () => ({
  query: vi.fn(),
}));

const SCHEDULE_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
const NURSE_ID = 'a1b2c3d4-e5f6-4a8b-9c0d-1e2f3a4b5c6d';

const queryMock = vi.mocked(query);

describe('Stats API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/stats/monthly/:schedule_id', () => {
    it('returns monthly statistics for a schedule', async () => {
      const mockSchedule = { id: SCHEDULE_ID, month: '2025-10-01' };
      const mockNurseStats = [
        { nurse_id: 'nurse-1', nurse_name: 'A', nurse_role: 'staff', total_hours: 160, night_shift_count: 4, weekend_shift_count: 2 },
        { nurse_id: 'nurse-2', nurse_name: 'B', nurse_role: 'responsible', total_hours: 40, night_shift_count: 0, weekend_shift_count: 0 },
      ];
      const mockFairness = {
        fairness_score: 95.5,
        hours_score: 90,
        nights_score: 98,
        weekends_score: 99,
        hours_std_dev: 1,
        nights_std_dev: 0.5,
        weekends_std_dev: 0,
      };

      queryMock
        .mockResolvedValueOnce(createQueryResult({ rows: [mockSchedule] })) // schedule exists
        .mockResolvedValueOnce(createQueryResult({ rows: [] })) // refresh view
        .mockResolvedValueOnce(createQueryResult({ rows: mockNurseStats })) // nurse stats
        .mockResolvedValueOnce(createQueryResult({ rows: [mockFairness] })); // fairness

      const res = await request(app).get(`/api/stats/monthly/${SCHEDULE_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.data.schedule_id).toBe(SCHEDULE_ID);
      expect(res.body.data.nurses).toHaveLength(2);
      expect(res.body.data.fairness_score.overall).toBe(95.5);
    });

    it('returns zeroed stats when no staff data exists', async () => {
      const mockSchedule = { id: SCHEDULE_ID, month: '2025-11-01' };

      queryMock
        .mockResolvedValueOnce(createQueryResult({ rows: [mockSchedule] }))
        .mockResolvedValueOnce(createQueryResult({ rows: [] }))
        .mockResolvedValueOnce(createQueryResult({ rows: [] }))
        .mockResolvedValueOnce(createQueryResult({ rows: [] }));

      const res = await request(app).get(`/api/stats/monthly/${SCHEDULE_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.data.nurses).toEqual([]);
      expect(res.body.data.averages).toEqual({
        staff_avg_hours: 0,
        staff_avg_nights: 0,
        staff_avg_weekends: 0,
      });
      expect(res.body.data.fairness_score).toEqual({
        overall: 0,
        hours_score: 0,
        nights_score: 0,
        weekends_score: 0,
        hours_std_dev: 0,
        nights_std_dev: 0,
        weekends_std_dev: 0,
      });
    });

    it('returns 404 when schedule missing', async () => {
      queryMock.mockResolvedValueOnce(createQueryResult({ rows: [] }));

      const res = await request(app).get(`/api/stats/monthly/${SCHEDULE_ID}`);

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Plan bulunamadı');
    });
  });

  describe('GET /api/stats/nurse/:nurse_id/schedule/:schedule_id', () => {
    it('returns detailed stats for a nurse', async () => {
      const nurseSummary = {
        nurse_id: NURSE_ID,
        nurse_name: 'Alice',
        nurse_role: 'staff',
        total_hours: 160,
      };
      const assignments = [{ date: '2025-10-01', type: 'day_8h', hours: 8 }];

      queryMock
        .mockResolvedValueOnce(createQueryResult({ rows: [] })) // refresh view
        .mockResolvedValueOnce(createQueryResult({ rows: [nurseSummary] }))
        .mockResolvedValueOnce(createQueryResult({ rows: assignments }));

      const res = await request(app).get(`/api/stats/nurse/${NURSE_ID}/schedule/${SCHEDULE_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toEqual(nurseSummary);
      expect(res.body.data.assignments).toEqual(assignments);
    });

    it('returns 404 when no nurse stats found', async () => {
      queryMock
        .mockResolvedValueOnce(createQueryResult({ rows: [] })) // refresh view
        .mockResolvedValueOnce(createQueryResult({ rows: [] })); // stats lookup

      const res = await request(app).get(`/api/stats/nurse/${NURSE_ID}/schedule/${SCHEDULE_ID}`);

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('İstatistik bulunamadı');
    });
  });
});
