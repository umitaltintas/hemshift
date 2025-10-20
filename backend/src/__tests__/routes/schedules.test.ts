import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import app from '../../server';
import { ScheduleModel } from '../../models/Schedule';
import { SchedulerService } from '../../services/scheduler.service';

vi.mock('../../models/Schedule');
vi.mock('../../services/scheduler.service');

const SCHEDULE_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
const MONTH = '2025-12';

const scheduleMock = vi.mocked(ScheduleModel);

describe('Schedules API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('GET /api/schedules returns all schedules', async () => {
    const schedules = [{ id: SCHEDULE_ID, month: '2025-10-01' }];
    scheduleMock.findAll.mockResolvedValue(schedules);

    const res = await request(app).get('/api/schedules');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(schedules);
  });

  it('GET /api/schedules/:month rejects invalid format', async () => {
    const res = await request(app).get('/api/schedules/202510');

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Geçersiz ay formatı (YYYY-MM bekleniyor)');
  });

  it('GET /api/schedules/:month returns 404 when month not found', async () => {
    scheduleMock.findByMonth.mockResolvedValue(null);

    const res = await request(app).get('/api/schedules/2025-10');

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Bu ay için plan bulunamadı');
  });

  it('GET /api/schedules/:month returns detailed schedule', async () => {
    scheduleMock.findByMonth.mockResolvedValue({ id: SCHEDULE_ID, month: '2025-10-01' });
    const detail = { id: SCHEDULE_ID, days: [] };
    scheduleMock.findDetailById.mockResolvedValue(detail as any);

    const res = await request(app).get('/api/schedules/2025-10');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(detail);
    expect(scheduleMock.findDetailById).toHaveBeenCalledWith(SCHEDULE_ID);
  });

  it('POST /api/schedules/generate creates a new schedule', async () => {
    scheduleMock.existsForMonth.mockResolvedValue(false);
    scheduleMock.create.mockResolvedValue({ id: SCHEDULE_ID, month: `${MONTH}-01` } as any);
    (SchedulerService.prototype.generateSchedule as Mock).mockResolvedValue({
      fairness_score: 95,
      shifts: 10,
      assignments: 30,
      warnings: [],
      generation_time_ms: 123,
    });

    const res = await request(app).post('/api/schedules/generate').send({ month: MONTH });

    expect(res.status).toBe(201);
    expect(scheduleMock.create).toHaveBeenCalledWith({ month: MONTH });
    expect(SchedulerService.prototype.generateSchedule).toHaveBeenCalledWith(SCHEDULE_ID, MONTH);
  });

  it('POST /api/schedules/generate returns 409 when schedule exists', async () => {
    scheduleMock.existsForMonth.mockResolvedValue(true);

    const res = await request(app).post('/api/schedules/generate').send({ month: MONTH });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('Bu ay için plan zaten mevcut');
  });

  it('PUT /api/schedules/:id updates schedule status', async () => {
    scheduleMock.findById.mockResolvedValue({ id: SCHEDULE_ID });
    const updated = { id: SCHEDULE_ID, status: 'archived' };
    scheduleMock.update.mockResolvedValue(updated as any);

    const res = await request(app).put(`/api/schedules/${SCHEDULE_ID}`).send({ status: 'archived' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(updated);
    expect(scheduleMock.update).toHaveBeenCalledWith(SCHEDULE_ID, { status: 'archived' });
  });

  it('PUT /api/schedules/:id returns 404 when schedule missing', async () => {
    scheduleMock.findById.mockResolvedValue(null);

    const res = await request(app).put(`/api/schedules/${SCHEDULE_ID}`).send({ status: 'archived' });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Plan bulunamadı');
  });

  it('POST /api/schedules/:id/publish publishes draft', async () => {
    const draft = { id: SCHEDULE_ID, status: 'draft' };
    scheduleMock.findById.mockResolvedValue(draft as any);
    scheduleMock.update.mockResolvedValue({ ...draft, status: 'published' } as any);

    const res = await request(app).post(`/api/schedules/${SCHEDULE_ID}/publish`);

    expect(res.status).toBe(200);
    expect(scheduleMock.update).toHaveBeenCalledWith(SCHEDULE_ID, { status: 'published' });
  });

  it('POST /api/schedules/:id/publish rejects missing schedule', async () => {
    scheduleMock.findById.mockResolvedValue(null);

    const res = await request(app).post(`/api/schedules/${SCHEDULE_ID}/publish`);

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Plan bulunamadı');
  });

  it('POST /api/schedules/:id/publish rejects already published schedule', async () => {
    scheduleMock.findById.mockResolvedValue({ id: SCHEDULE_ID, status: 'published' } as any);

    const res = await request(app).post(`/api/schedules/${SCHEDULE_ID}/publish`);

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('Plan zaten yayınlanmış');
  });

  it('DELETE /api/schedules/:id deletes draft schedule', async () => {
    scheduleMock.findById.mockResolvedValue({ id: SCHEDULE_ID, status: 'draft' } as any);
    scheduleMock.delete.mockResolvedValue(true);

    const res = await request(app).delete(`/api/schedules/${SCHEDULE_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Plan başarıyla silindi');
  });

  it('DELETE /api/schedules/:id rejects missing schedule', async () => {
    scheduleMock.findById.mockResolvedValue(null);

    const res = await request(app).delete(`/api/schedules/${SCHEDULE_ID}`);

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Plan bulunamadı');
  });

  it('DELETE /api/schedules/:id rejects deletion of published schedule', async () => {
    scheduleMock.findById.mockResolvedValue({ id: SCHEDULE_ID, status: 'published' } as any);

    const res = await request(app).delete(`/api/schedules/${SCHEDULE_ID}`);

    expect(res.status).toBe(409);
    expect(res.body.error.message).toContain('Yayınlanmış plan silinemez');
  });

  it('DELETE /api/schedules/:id returns 404 when delete fails', async () => {
    scheduleMock.findById.mockResolvedValue({ id: SCHEDULE_ID, status: 'draft' } as any);
    scheduleMock.delete.mockResolvedValue(false);

    const res = await request(app).delete(`/api/schedules/${SCHEDULE_ID}`);

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Plan bulunamadı');
  });

  it('POST /api/schedules/:id/validate validates schedule completeness', async () => {
    const schedule = { id: SCHEDULE_ID, month: '2025-10-01', status: 'draft' };
    const detail = {
      ...schedule,
      days: [
        {
          date: '2025-10-01',
          is_weekend: false,
          shifts: [
            { id: '1', type: 'day_8h', is_complete: true, current_staff: 2, requires_responsible: true, current_responsible: true, required_staff: 2 }
          ]
        }
      ],
      stats: { total_days: 31, complete_shifts: 1, incomplete_shifts: 0 }
    };
    scheduleMock.findById.mockResolvedValue(schedule as any);
    scheduleMock.findDetailById.mockResolvedValue(detail as any);

    const res = await request(app).post(`/api/schedules/${SCHEDULE_ID}/validate`);

    expect(res.status).toBe(200);
    expect(res.body.data.is_valid).toBe(true);
    expect(res.body.data.validation.incomplete_shifts).toBe(0);
  });

  it('POST /api/schedules/:id/validate returns invalid when shifts incomplete', async () => {
    const schedule = { id: SCHEDULE_ID, month: '2025-10-01', status: 'draft' };
    const detail = {
      ...schedule,
      days: [
        {
          date: '2025-10-01',
          is_weekend: false,
          shifts: [
            { id: '1', type: 'day_8h', is_complete: false, current_staff: 1, requires_responsible: false, current_responsible: false, required_staff: 2 }
          ]
        }
      ],
      stats: { total_days: 31, complete_shifts: 0, incomplete_shifts: 1 }
    };
    scheduleMock.findById.mockResolvedValue(schedule as any);
    scheduleMock.findDetailById.mockResolvedValue(detail as any);

    const res = await request(app).post(`/api/schedules/${SCHEDULE_ID}/validate`);

    expect(res.status).toBe(200);
    expect(res.body.data.is_valid).toBe(false);
    expect(res.body.data.validation.incomplete_shifts).toBe(1);
    expect(res.body.data.validation.issues.length).toBeGreaterThan(0);
  });

  it('POST /api/schedules/:id/validate returns 404 when schedule missing', async () => {
    scheduleMock.findById.mockResolvedValue(null);

    const res = await request(app).post(`/api/schedules/${SCHEDULE_ID}/validate`);

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Plan bulunamadı');
  });

  it('GET /api/schedules/:id/export/excel exports schedule data', async () => {
    const schedule = { id: SCHEDULE_ID, month: '2025-10-01', status: 'draft', fairness_score: 95 };
    const detail = {
      ...schedule,
      days: [
        {
          date: '2025-10-01',
          is_weekend: false,
          shifts: [
            {
              id: '1',
              type: 'day_8h',
              start_time: '08:00',
              end_time: '16:00',
              required_staff: 2,
              current_staff: 2,
              assignments: [
                { nurse_id: 'n1', nurse_name: 'Ayşe', nurse_role: 'staff' }
              ]
            }
          ]
        }
      ],
      stats: { total_days: 31, complete_shifts: 1, incomplete_shifts: 0 }
    };
    scheduleMock.findById.mockResolvedValue(schedule as any);
    scheduleMock.findDetailById.mockResolvedValue(detail as any);

    const res = await request(app).get(`/api/schedules/${SCHEDULE_ID}/export/excel`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.schedule).toEqual({ id: SCHEDULE_ID, month: '2025-10-01', status: 'draft', fairness_score: 95 });
  });

  it('GET /api/schedules/:id/export/csv exports schedule as CSV', async () => {
    const schedule = { id: SCHEDULE_ID, month: '2025-10-01', status: 'draft' };
    const detail = {
      ...schedule,
      days: [
        {
          date: '2025-10-01',
          is_weekend: false,
          shifts: [
            {
              id: '1',
              type: 'day_8h',
              start_time: '08:00',
              end_time: '16:00',
              required_staff: 2,
              current_staff: 2,
              assignments: [
                { nurse_id: 'n1', nurse_name: 'Ayşe', nurse_role: 'staff' }
              ]
            }
          ]
        }
      ],
      stats: { total_days: 31, complete_shifts: 1, incomplete_shifts: 0 }
    };
    scheduleMock.findById.mockResolvedValue(schedule as any);
    scheduleMock.findDetailById.mockResolvedValue(detail as any);

    const res = await request(app).get(`/api/schedules/${SCHEDULE_ID}/export/csv`);

    expect(res.status).toBe(200);
    expect(res.text).toContain('Tarih');
    expect(res.text).toContain('2025-10-01');
  });

  it('GET /api/schedules/:id/export/excel returns 404 when schedule missing', async () => {
    scheduleMock.findById.mockResolvedValue(null);

    const res = await request(app).get(`/api/schedules/${SCHEDULE_ID}/export/excel`);

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Plan bulunamadı');
  });
});
