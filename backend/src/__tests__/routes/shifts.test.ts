import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../server';
import { ShiftModel, ShiftAssignmentModel } from '../../models/Shift';
import { NurseModel } from '../../models/Nurse';
import { LeaveModel } from '../../models/Leave';

// Mock the models
vi.mock('../../models/Shift');
vi.mock('../../models/Nurse');
vi.mock('../../models/Leave');

const SHIFT_ID = 'f0a1b2c3-d4e5-4f6a-b7c8-d9e0f1a2b3c4';
const NURSE_ID = 'a1b2c3d4-e5f6-4a8b-9c0d-1e2f3a4b5c6d';
const SCHEDULE_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';
const ASSIGNMENT_ID = 'c3d4e5f6-a7b8-4c9d-a0e1-f2a3b4c5d6e7';

describe('Shifts API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/shifts', () => {
    it('should return shifts for a given schedule_id', async () => {
      const mockShifts = [{ id: SHIFT_ID, required_staff: 2 }];
      const mockAssignments = [{ id: ASSIGNMENT_ID, nurse_name: 'Test Nurse' }];
      const mockCounts = { staff_count: 1, responsible_count: 0 };

      (ShiftModel.findBySchedule as vi.Mock).mockResolvedValue(mockShifts);
      (ShiftAssignmentModel.findByShift as vi.Mock).mockResolvedValue(mockAssignments);
      (ShiftAssignmentModel.getShiftCounts as vi.Mock).mockResolvedValue(mockCounts);

      const response = await request(app).get(`/api/shifts?schedule_id=${SCHEDULE_ID}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0].assignments).toEqual(mockAssignments);
      expect(ShiftModel.findBySchedule).toHaveBeenCalledWith(SCHEDULE_ID);
    });

    it('should return a 404 if schedule_id is missing', async () => {
        const response = await request(app).get('/api/shifts');
        expect(response.status).toBe(404);
      });
  });

  describe('POST /api/shifts/:shift_id/assign', () => {
    const mockShift = { id: SHIFT_ID, date: '2025-10-20', schedule_id: SCHEDULE_ID, type: 'day_8h', required_staff: 1 };
    const mockNurse = { id: NURSE_ID, name: 'Nurse Jackie', role: 'staff' };

    it('should assign a nurse to a shift successfully', async () => {
      (ShiftModel.findById as vi.Mock).mockResolvedValue(mockShift);
      (NurseModel.findById as vi.Mock).mockResolvedValue(mockNurse);
      (LeaveModel.isNurseOnLeave as vi.Mock).mockResolvedValue(false);
      (ShiftAssignmentModel.isNurseAssignedOnDate as vi.Mock).mockResolvedValue(false);
      (ShiftAssignmentModel.getShiftCounts as vi.Mock).mockResolvedValue({ staff_count: 0, responsible_count: 0 });
      (ShiftAssignmentModel.create as vi.Mock).mockResolvedValue({ id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' });

      const response = await request(app)
        .post(`/api/shifts/${SHIFT_ID}/assign`)
        .send({ nurse_id: NURSE_ID });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Hemşire vardiyaya başarıyla atandı');
    });

    it('should return 409 if nurse is on leave', async () => {
        (ShiftModel.findById as vi.Mock).mockResolvedValue(mockShift);
        (NurseModel.findById as vi.Mock).mockResolvedValue(mockNurse);
        (LeaveModel.isNurseOnLeave as vi.Mock).mockResolvedValue(true); // Nurse is on leave
  
        const response = await request(app)
          .post(`/api/shifts/${SHIFT_ID}/assign`)
          .send({ nurse_id: NURSE_ID });
  
        expect(response.status).toBe(409);
        expect(response.body.error.message).toBe('Hemşire bu tarihte izinde');
      });

      it('should return 409 if shift is full', async () => {
        (ShiftModel.findById as vi.Mock).mockResolvedValue(mockShift);
        (NurseModel.findById as vi.Mock).mockResolvedValue(mockNurse);
        (LeaveModel.isNurseOnLeave as vi.Mock).mockResolvedValue(false);
        (ShiftAssignmentModel.isNurseAssignedOnDate as vi.Mock).mockResolvedValue(false);
        (ShiftAssignmentModel.getShiftCounts as vi.Mock).mockResolvedValue({ staff_count: 1, responsible_count: 0 }); // Shift is full
  
        const response = await request(app)
          .post(`/api/shifts/${SHIFT_ID}/assign`)
          .send({ nurse_id: NURSE_ID });
  
        expect(response.status).toBe(409);
        expect(response.body.error.message).toContain('maksimum staf sayısına ulaşıldı');
      });

      it('should return 409 when assigning a responsible nurse to a non-day shift', async () => {
        const nightShift = { ...mockShift, type: 'night_16h' };
        const responsibleNurse = { ...mockNurse, role: 'responsible' };

        (ShiftModel.findById as vi.Mock).mockResolvedValue(nightShift);
        (NurseModel.findById as vi.Mock).mockResolvedValue(responsibleNurse);
        (LeaveModel.isNurseOnLeave as vi.Mock).mockResolvedValue(false);
        (ShiftAssignmentModel.isNurseAssignedOnDate as vi.Mock).mockResolvedValue(false);

        const response = await request(app)
          .post(`/api/shifts/${SHIFT_ID}/assign`)
          .send({ nurse_id: NURSE_ID });

        expect(response.status).toBe(409);
        expect(response.body.error.message).toBe('Sorumlu hemşire sadece 8 saatlik gündüz vardiyasında çalışabilir');
      });

  });

  describe('DELETE /api/shifts/assignments/:id', () => {
    it('should delete an assignment', async () => {
        (ShiftAssignmentModel.delete as vi.Mock).mockResolvedValue(true);

        const response = await request(app).delete(`/api/shifts/assignments/${ASSIGNMENT_ID}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Atama başarıyla kaldırıldı');
        expect(ShiftAssignmentModel.delete).toHaveBeenCalledWith(ASSIGNMENT_ID);
    });

    it('should return 404 if assignment not found', async () => {
        (ShiftAssignmentModel.delete as vi.Mock).mockResolvedValue(false);

        const response = await request(app).delete(`/api/shifts/assignments/${ASSIGNMENT_ID}`);

        expect(response.status).toBe(404);
        expect(response.body.error.message).toBe('Atama bulunamadı');
    });
  });

});
