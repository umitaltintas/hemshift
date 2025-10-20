import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../server';
import { query } from '../../db/connection';

// Mock the query function
vi.mock('../../db/connection', () => ({
  query: vi.fn(),
}));

const SCHEDULE_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';

describe('Stats API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/stats/monthly/:schedule_id', () => {

    it('should return monthly statistics for a schedule', async () => {
      const mockSchedule = { id: SCHEDULE_ID, month: '2025-10-01' };
      const mockNurseStats = [
        { nurse_id: 'nurse-1', nurse_name: 'A', nurse_role: 'staff', total_hours: 160, night_shift_count: 4, weekend_shift_count: 2 },
        { nurse_id: 'nurse-2', nurse_name: 'B', nurse_role: 'responsible', total_hours: 40, night_shift_count: 0, weekend_shift_count: 0 },
      ];
      const mockFairness = { fairness_score: 95.5, hours_score: 90, nights_score: 98, weekends_score: 99 };

      // Mock the sequence of query calls
      (query as vi.Mock)
        .mockResolvedValueOnce({ rows: [mockSchedule] }) // Schedule check
        .mockResolvedValueOnce({ rows: [] }) // REFRESH VIEW
        .mockResolvedValueOnce({ rows: mockNurseStats }) // Nurse stats
        .mockResolvedValueOnce({ rows: [mockFairness] }); // Fairness score

      const response = await request(app).get(`/api/stats/monthly/${SCHEDULE_ID}`);

      expect(response.status).toBe(200);
      expect(response.body.data.schedule_id).toBe(SCHEDULE_ID);
      expect(response.body.data.nurses.length).toBe(2);
      expect(response.body.data.fairness_score.overall).toBe(95.5);
      expect(query).toHaveBeenCalledTimes(4);
    });

    it('should return 404 if schedule not found', async () => {
        (query as vi.Mock).mockResolvedValueOnce({ rows: [] }); // Schedule check fails
  
        const response = await request(app).get(`/api/stats/monthly/${SCHEDULE_ID}`);
  
        expect(response.status).toBe(404);
        expect(response.body.error.message).toBe('Plan bulunamadı');
      });
  });
});
