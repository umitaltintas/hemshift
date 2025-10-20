import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../server';
import { ScheduleModel } from '../../models/Schedule';
import { SchedulerService } from '../../services/scheduler.service';

// Mock the models and services
vi.mock('../../models/Schedule');
vi.mock('../../services/scheduler.service');

const SCHEDULE_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';

describe('Schedules API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/schedules', () => {
    it('should return all schedules', async () => {
      const mockSchedules = [{ id: SCHEDULE_ID, month: '2025-10-01' }];
      (ScheduleModel.findAll as vi.Mock).mockResolvedValue(mockSchedules);

      const response = await request(app).get('/api/schedules');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockSchedules);
    });
  });

  describe('POST /api/schedules/generate', () => {
    it('should generate a new schedule', async () => {
      const month = '2025-12';
      const mockSchedule = { id: '2b3c4d5e-6f78-9012-3456-7890abcdef12', month: `${month}-01` };
      const mockGenerationResult = { fairness_score: 95, warnings: [] };

      (ScheduleModel.existsForMonth as vi.Mock).mockResolvedValue(false);
      (ScheduleModel.create as vi.Mock).mockResolvedValue(mockSchedule);
      (SchedulerService.prototype.generateSchedule as vi.Mock).mockResolvedValue(mockGenerationResult);

      const response = await request(app).post('/api/schedules/generate').send({ month });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Plan başarıyla oluşturuldu');
      expect(ScheduleModel.create).toHaveBeenCalledWith({ month });
      expect(SchedulerService.prototype.generateSchedule).toHaveBeenCalledWith(mockSchedule.id, month);
    });

    it('should return 409 if schedule for month already exists', async () => {
        const month = '2025-12';
        (ScheduleModel.existsForMonth as vi.Mock).mockResolvedValue(true);
  
        const response = await request(app).post('/api/schedules/generate').send({ month });
  
        expect(response.status).toBe(409);
        expect(response.body.error.message).toBe('Bu ay için plan zaten mevcut');
      });
  });

  describe('DELETE /api/schedules/:id', () => {
    it('should delete a draft schedule', async () => {
        (ScheduleModel.findById as vi.Mock).mockResolvedValue({ id: SCHEDULE_ID, status: 'draft' });
        (ScheduleModel.delete as vi.Mock).mockResolvedValue(true);

        const response = await request(app).delete(`/api/schedules/${SCHEDULE_ID}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Plan başarıyla silindi');
    });

    it('should return 409 when trying to delete a published schedule', async () => {
        (ScheduleModel.findById as vi.Mock).mockResolvedValue({ id: SCHEDULE_ID, status: 'published' });

        const response = await request(app).delete(`/api/schedules/${SCHEDULE_ID}`);

        expect(response.status).toBe(409);
        expect(response.body.error.message).toContain('Yayınlanmış plan silinemez');
    });
  });

});
