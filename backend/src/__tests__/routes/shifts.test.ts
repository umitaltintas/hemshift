import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
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
    it('returns shifts for a given schedule_id', async () => {
      const mockShifts = [{ id: SHIFT_ID, required_staff: 2 }];
      const mockAssignments = [{ id: ASSIGNMENT_ID, nurse_name: 'Test Nurse' }];
      const mockCounts = { staff_count: 1, responsible_count: 0 };

      (ShiftModel.findBySchedule as Mock).mockResolvedValue(mockShifts);
      (ShiftAssignmentModel.findByShift as Mock).mockResolvedValue(mockAssignments);
      (ShiftAssignmentModel.getShiftCounts as Mock).mockResolvedValue(mockCounts);

      const response = await request(app).get(`/api/shifts?schedule_id=${SCHEDULE_ID}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0].assignments).toEqual(mockAssignments);
      expect(ShiftModel.findBySchedule).toHaveBeenCalledWith(SCHEDULE_ID);
    });

    it('returns shifts for a specific date when provided', async () => {
      const date = '2025-10-20';
      const mockShifts = [{ id: SHIFT_ID, required_staff: 1, requires_responsible: false }];
      (ShiftModel.findByDate as Mock).mockResolvedValue(mockShifts);
      (ShiftAssignmentModel.findByShift as Mock).mockResolvedValue([]);
      (ShiftAssignmentModel.getShiftCounts as Mock).mockResolvedValue({ staff_count: 1, responsible_count: 0 });

      const response = await request(app).get(`/api/shifts?schedule_id=${SCHEDULE_ID}&date=${date}`);

      expect(response.status).toBe(200);
      expect(ShiftModel.findByDate).toHaveBeenCalledWith(SCHEDULE_ID, date);
      expect(response.body.data[0].is_complete).toBe(true);
    });

    it('returns a 404 if schedule_id is missing', async () => {
        const response = await request(app).get('/api/shifts');
        expect(response.status).toBe(404);
      });
  });

  describe('GET /api/shifts/:id', () => {
    it('returns shift with assignments', async () => {
      const shift = { id: SHIFT_ID, schedule_id: SCHEDULE_ID };
      const assignments = [{ id: ASSIGNMENT_ID }];
      const counts = { staff_count: 1, responsible_count: 1 };

      (ShiftModel.findById as Mock).mockResolvedValue(shift);
      (ShiftAssignmentModel.findByShift as Mock).mockResolvedValue(assignments);
      (ShiftAssignmentModel.getShiftCounts as Mock).mockResolvedValue(counts);

      const response = await request(app).get(`/api/shifts/${SHIFT_ID}`);

      expect(response.status).toBe(200);
      expect(response.body.data.assignments).toEqual(assignments);
      expect(response.body.data.current_staff).toBe(1);
    });

    it('returns 404 when shift not found', async () => {
      (ShiftModel.findById as Mock).mockResolvedValue(null);

      const response = await request(app).get(`/api/shifts/${SHIFT_ID}`);

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe('Vardiya bulunamadı');
    });
  });

  describe('POST /api/shifts/:shift_id/assign', () => {
    const mockShift = { id: SHIFT_ID, date: '2025-10-20', schedule_id: SCHEDULE_ID, type: 'day_8h', required_staff: 1 };
    const mockNurse = { id: NURSE_ID, name: 'Nurse Jackie', role: 'staff' };

    it('assigns a nurse to a shift successfully', async () => {
      (ShiftModel.findById as Mock).mockResolvedValue(mockShift);
      (NurseModel.findById as Mock).mockResolvedValue(mockNurse);
      (LeaveModel.isNurseOnLeave as Mock).mockResolvedValue(false);
      (ShiftAssignmentModel.isNurseAssignedOnDate as Mock).mockResolvedValue(false);
      (ShiftAssignmentModel.getShiftCounts as Mock).mockResolvedValue({ staff_count: 0, responsible_count: 0 });
      (ShiftAssignmentModel.create as Mock).mockResolvedValue({ id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' });

      const response = await request(app)
        .post(`/api/shifts/${SHIFT_ID}/assign`)
        .send({ nurse_id: NURSE_ID });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Hemşire vardiyaya başarıyla atandı');
    });

    it('returns 404 if shift not found', async () => {
      (ShiftModel.findById as Mock).mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/shifts/${SHIFT_ID}/assign`)
        .send({ nurse_id: NURSE_ID });

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe('Vardiya bulunamadı');
    });

    it('returns 404 if nurse not found', async () => {
      (ShiftModel.findById as Mock).mockResolvedValue(mockShift);
      (NurseModel.findById as Mock).mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/shifts/${SHIFT_ID}/assign`)
        .send({ nurse_id: NURSE_ID });

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe('Hemşire bulunamadı');
    });

    it('returns 409 if nurse is on leave', async () => {
        (ShiftModel.findById as Mock).mockResolvedValue(mockShift);
        (NurseModel.findById as Mock).mockResolvedValue(mockNurse);
        (LeaveModel.isNurseOnLeave as Mock).mockResolvedValue(true); // Nurse is on leave
  
        const response = await request(app)
          .post(`/api/shifts/${SHIFT_ID}/assign`)
          .send({ nurse_id: NURSE_ID });
  
        expect(response.status).toBe(409);
        expect(response.body.error.message).toBe('Hemşire bu tarihte izinde');
      });

      it('returns 409 if nurse already assigned same day', async () => {
        (ShiftModel.findById as Mock).mockResolvedValue(mockShift);
        (NurseModel.findById as Mock).mockResolvedValue(mockNurse);
        (LeaveModel.isNurseOnLeave as Mock).mockResolvedValue(false);
        (ShiftAssignmentModel.isNurseAssignedOnDate as Mock).mockResolvedValue(true);

        const response = await request(app)
          .post(`/api/shifts/${SHIFT_ID}/assign`)
          .send({ nurse_id: NURSE_ID });

        expect(response.status).toBe(409);
        expect(response.body.error.message).toBe('Hemşire bu günde zaten başka bir vardiyaya atanmış');
      });

      it('returns 409 if shift is full', async () => {
        (ShiftModel.findById as Mock).mockResolvedValue(mockShift);
        (NurseModel.findById as Mock).mockResolvedValue(mockNurse);
        (LeaveModel.isNurseOnLeave as Mock).mockResolvedValue(false);
        (ShiftAssignmentModel.isNurseAssignedOnDate as Mock).mockResolvedValue(false);
        (ShiftAssignmentModel.getShiftCounts as Mock).mockResolvedValue({ staff_count: 1, responsible_count: 0 }); // Shift is full
  
        const response = await request(app)
          .post(`/api/shifts/${SHIFT_ID}/assign`)
          .send({ nurse_id: NURSE_ID });
  
        expect(response.status).toBe(409);
        expect(response.body.error.message).toContain('maksimum staf sayısına ulaşıldı');
      });

      it('should return 409 when assigning a responsible nurse to a non-day shift', async () => {
        const nightShift = { ...mockShift, type: 'night_16h' };
        const responsibleNurse = { ...mockNurse, role: 'responsible' };

        (ShiftModel.findById as Mock).mockResolvedValue(nightShift);
        (NurseModel.findById as Mock).mockResolvedValue(responsibleNurse);
        (LeaveModel.isNurseOnLeave as Mock).mockResolvedValue(false);
        (ShiftAssignmentModel.isNurseAssignedOnDate as Mock).mockResolvedValue(false);

        const response = await request(app)
          .post(`/api/shifts/${SHIFT_ID}/assign`)
          .send({ nurse_id: NURSE_ID });

        expect(response.status).toBe(409);
        expect(response.body.error.message).toBe('Sorumlu hemşire sadece 8 saatlik gündüz vardiyasında çalışabilir');
      });

      it('returns 409 when responsible slot already filled', async () => {
        const responsibleNurse = { ...mockNurse, role: 'responsible' };
        (ShiftModel.findById as Mock).mockResolvedValue(mockShift);
        (NurseModel.findById as Mock).mockResolvedValue(responsibleNurse);
        (LeaveModel.isNurseOnLeave as Mock).mockResolvedValue(false);
        (ShiftAssignmentModel.isNurseAssignedOnDate as Mock).mockResolvedValue(false);
        (ShiftAssignmentModel.getShiftCounts as Mock).mockResolvedValue({ staff_count: 0, responsible_count: 1 });

        const response = await request(app)
          .post(`/api/shifts/${SHIFT_ID}/assign`)
          .send({ nurse_id: NURSE_ID });

        expect(response.status).toBe(409);
        expect(response.body.error.message).toBe('Bu vardiyada zaten sorumlu hemşire var');
      });

  });

  describe('DELETE /api/shifts/assignments/:id', () => {
    it('should delete an assignment', async () => {
        (ShiftAssignmentModel.delete as Mock).mockResolvedValue(true);

        const response = await request(app).delete(`/api/shifts/assignments/${ASSIGNMENT_ID}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Atama başarıyla kaldırıldı');
        expect(ShiftAssignmentModel.delete).toHaveBeenCalledWith(ASSIGNMENT_ID);
    });

    it('should return 404 if assignment not found', async () => {
        (ShiftAssignmentModel.delete as Mock).mockResolvedValue(false);

        const response = await request(app).delete(`/api/shifts/assignments/${ASSIGNMENT_ID}`);

        expect(response.status).toBe(404);
        expect(response.body.error.message).toBe('Atama bulunamadı');
    });
  });

});
