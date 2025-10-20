import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../server';
import { LeaveModel } from '../../models/Leave';
import { NurseModel } from '../../models/Nurse';

// Mock the models
vi.mock('../../models/Leave');
vi.mock('../../models/Nurse');

const LEAVE_ID = '4e3a2d6a-0b1a-4b8e-9e3a-5b6c7d8e9f0a';
const NURSE_ID = 'a1b2c3d4-e5f6-4a8b-9c0d-1e2f3a4b5c6d';

describe('Leaves API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/leaves', () => {
    it('should return all leaves', async () => {
      const mockLeaves = [{ id: LEAVE_ID, nurse_name: 'Nurse Betty' }];
      (LeaveModel.findAll as vi.Mock).mockResolvedValue(mockLeaves);

      const response = await request(app).get('/api/leaves');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockLeaves);
      expect(LeaveModel.findAll).toHaveBeenCalledOnce();
    });
  });

  describe('GET /api/leaves/:id', () => {
    it('should return a single leave if found', async () => {
      const mockLeave = { id: LEAVE_ID, nurse_name: 'Nurse Betty' };
      (LeaveModel.findById as vi.Mock).mockResolvedValue(mockLeave);

      const response = await request(app).get(`/api/leaves/${LEAVE_ID}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockLeave);
      expect(LeaveModel.findById).toHaveBeenCalledWith(LEAVE_ID);
    });

    it('should return 404 if leave not found', async () => {
      (LeaveModel.findById as vi.Mock).mockResolvedValue(null);

      const response = await request(app).get(`/api/leaves/${LEAVE_ID}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/leaves', () => {
    it('should create a new leave', async () => {
      const newLeave = { nurse_id: NURSE_ID, type: 'annual', start_date: '2025-11-01', end_date: '2025-11-05' };
      const createdLeave = { id: 'a2b3c4d5-e6f7-8901-2345-67890abcdef2', ...newLeave };
      (NurseModel.findById as vi.Mock).mockResolvedValue({ id: NURSE_ID, name: 'Nurse'});
      (LeaveModel.create as vi.Mock).mockResolvedValue(createdLeave);

      const response = await request(app).post('/api/leaves').send(newLeave);

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(createdLeave);
      expect(response.body.message).toBe('İzin başarıyla eklendi');
    });

    it('should return 404 if nurse for leave does not exist', async () => {
        const newLeave = { nurse_id: NURSE_ID, type: 'annual', start_date: '2025-11-01', end_date: '2025-11-05' };
        (NurseModel.findById as vi.Mock).mockResolvedValue(null);
  
        const response = await request(app).post('/api/leaves').send(newLeave);
  
        expect(response.status).toBe(404);
        expect(response.body.error.message).toBe('Hemşire bulunamadı');
      });
  });

  describe('PUT /api/leaves/:id', () => {
    it('should update a leave', async () => {
      const leaveUpdate = { notes: 'Updated notes' };
      const updatedLeave = { id: LEAVE_ID, notes: 'Updated notes' };
      (LeaveModel.findById as vi.Mock).mockResolvedValue({ id: LEAVE_ID }); // found
      (LeaveModel.update as vi.Mock).mockResolvedValue(updatedLeave);

      const response = await request(app).put(`/api/leaves/${LEAVE_ID}`).send(leaveUpdate);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(updatedLeave);
      expect(response.body.message).toBe('İzin başarıyla güncellendi');
    });
  });

  describe('DELETE /api/leaves/:id', () => {
    it('should delete a leave', async () => {
        (LeaveModel.findById as vi.Mock).mockResolvedValue({ id: LEAVE_ID });
        (LeaveModel.delete as vi.Mock).mockResolvedValue(true);

        const response = await request(app).delete(`/api/leaves/${LEAVE_ID}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('İzin başarıyla silindi');
    });
  });
});
