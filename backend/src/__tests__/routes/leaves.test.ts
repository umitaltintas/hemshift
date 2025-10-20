import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../../server';
import { LeaveModel } from '../../models/Leave';
import { NurseModel } from '../../models/Nurse';

vi.mock('../../models/Leave');
vi.mock('../../models/Nurse');

const LEAVE_ID = '4e3a2d6a-0b1a-4b8e-9e3a-5b6c7d8e9f0a';
const NURSE_ID = 'a1b2c3d4-e5f6-4a8b-9c0d-1e2f3a4b5c6d';

const leaveMock = vi.mocked(LeaveModel);
const nurseMock = vi.mocked(NurseModel);

describe('Leaves API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/leaves', () => {
    it('returns all leaves', async () => {
      const leaves = [{ id: LEAVE_ID, nurse_name: 'Nurse Betty' }];
      leaveMock.findAll.mockResolvedValue(leaves);

      const res = await request(app).get('/api/leaves');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(leaves);
    });

    it('forwards filters to the model', async () => {
      leaveMock.findAll.mockResolvedValue([]);

      const res = await request(app).get(`/api/leaves?nurse_id=${NURSE_ID}&month=2025-11`);

      expect(res.status).toBe(200);
      expect(leaveMock.findAll).toHaveBeenCalledWith({ nurse_id: NURSE_ID, month: '2025-11' });
    });

    it('propagates errors through next()', async () => {
      leaveMock.findAll.mockRejectedValue(new Error('boom'));

      const res = await request(app).get('/api/leaves');

      expect(res.status).toBe(500);
      expect(res.body.error.message).toBe('boom');
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/leaves/:id', () => {
    it('returns a single leave when found', async () => {
      const leave = { id: LEAVE_ID, nurse_name: 'Nurse Betty' };
      leaveMock.findById.mockResolvedValue(leave as any);

      const res = await request(app).get(`/api/leaves/${LEAVE_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(leave);
    });

    it('returns 404 when leave missing', async () => {
      leaveMock.findById.mockResolvedValue(null);

      const res = await request(app).get(`/api/leaves/${LEAVE_ID}`);

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('İzin bulunamadı');
    });
  });

  describe('POST /api/leaves', () => {
    it('creates a new leave', async () => {
      const payload = { nurse_id: NURSE_ID, type: 'annual', start_date: '2025-11-01', end_date: '2025-11-05' };
      const created = { id: 'leave-new', ...payload };
      nurseMock.findById.mockResolvedValue({ id: NURSE_ID } as any);
      leaveMock.create.mockResolvedValue(created as any);

      const res = await request(app).post('/api/leaves').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual(created);
      expect(res.body.message).toBe('İzin başarıyla eklendi');
    });

    it('returns 404 when nurse not found', async () => {
      nurseMock.findById.mockResolvedValue(null);

      const res = await request(app).post('/api/leaves').send({ nurse_id: NURSE_ID, type: 'annual', start_date: '2025-11-01', end_date: '2025-11-05' });

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Hemşire bulunamadı');
    });
  });

  describe('PUT /api/leaves/:id', () => {
    it('updates an existing leave', async () => {
      const updated = { id: LEAVE_ID, notes: 'Updated notes' };
      leaveMock.findById.mockResolvedValue({ id: LEAVE_ID } as any);
      leaveMock.update.mockResolvedValue(updated as any);

      const res = await request(app).put(`/api/leaves/${LEAVE_ID}`).send({ notes: 'Updated notes' });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(updated);
    });

    it('returns 404 when leave missing', async () => {
      leaveMock.findById.mockResolvedValue(null);

      const res = await request(app).put(`/api/leaves/${LEAVE_ID}`).send({ notes: 'Updated notes' });

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('İzin bulunamadı');
    });
  });

  describe('DELETE /api/leaves/:id', () => {
    it('deletes a leave', async () => {
      leaveMock.findById.mockResolvedValue({ id: LEAVE_ID } as any);
      leaveMock.delete.mockResolvedValue(true);

      const res = await request(app).delete(`/api/leaves/${LEAVE_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('İzin başarıyla silindi');
    });

    it('returns 404 when leave missing', async () => {
      leaveMock.findById.mockResolvedValue(null);

      const res = await request(app).delete(`/api/leaves/${LEAVE_ID}`);

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('İzin bulunamadı');
    });

    it('returns 404 when deletion fails', async () => {
      leaveMock.findById.mockResolvedValue({ id: LEAVE_ID } as any);
      leaveMock.delete.mockResolvedValue(false);

      const res = await request(app).delete(`/api/leaves/${LEAVE_ID}`);

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('İzin bulunamadı');
    });
  });
});
