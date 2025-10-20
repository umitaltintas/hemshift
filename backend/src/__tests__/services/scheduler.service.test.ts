import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchedulerService } from '../../services/scheduler.service';
import { NurseModel } from '../../models/Nurse';
import { LeaveModel } from '../../models/Leave';
import { ShiftModel, ShiftAssignmentModel } from '../../models/Shift';
import { ScheduleModel } from '../../models/Schedule';
import * as dateUtils from '../../utils/dateUtils';

// Mock all the model dependencies
vi.mock('../../models/Nurse');
vi.mock('../../models/Leave');
vi.mock('../../models/Shift');
vi.mock('../../models/Schedule');
vi.mock('../../utils/dateUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof dateUtils>();
  return {
    ...actual,
    getMonthDates: vi.fn(),
    formatDate: vi.fn(),
    isWeekend: vi.fn(),
    isHoliday: vi.fn(),
    parseMonth: vi.fn(),
  };
});

describe('SchedulerService', () => {
  let schedulerService: SchedulerService;

  beforeEach(() => {
    vi.resetAllMocks();
    schedulerService = new SchedulerService();

    // Provide default mock implementations for dateUtils
    (dateUtils.parseMonth as vi.Mock).mockImplementation((month: string) => {
      const [year, monthNum] = month.split('-').map(Number);
      return new Date(year, monthNum - 1, 1);
    });
    (dateUtils.getMonthDates as vi.Mock).mockImplementation((year: number, month: number) => {
      const days = new Date(year, month + 1, 0).getDate();
      return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
    });
    (dateUtils.formatDate as vi.Mock).mockImplementation((date: Date) => date.toISOString().split('T')[0]);
    (dateUtils.isWeekend as vi.Mock).mockImplementation(d => [6, 0].includes(d.getDay()));
    (dateUtils.isHoliday as vi.Mock).mockReturnValue(false);
  });

  describe('generateSchedule', () => {
    it('should generate a schedule successfully under ideal conditions', async () => {
      // Arrange: Mock all model methods that will be called
      const mockDates = Array.from({ length: 31 }, (_, i) => new Date(2025, 9, i + 1));
      (dateUtils.getMonthDates as vi.Mock).mockReturnValue(mockDates);
      (dateUtils.formatDate as vi.Mock).mockImplementation((date: Date) => date.toISOString().split('T')[0]);
      (dateUtils.isWeekend as vi.Mock).mockReturnValue(false);
      (dateUtils.isHoliday as vi.Mock).mockReturnValue(false);

      // 1. Initialize
      const mockResponsibleNurse = { id: 'resp1', name: 'Resp Nurse', role: 'responsible' };
      const mockStaffNurses = [
        { id: 'staff1', name: 'A', role: 'staff' },
        { id: 'staff2', name: 'B', role: 'staff' },
        { id: 'staff3', name: 'C', role: 'staff' },
        { id: 'staff4', name: 'D', role: 'staff' },
      ];
      (NurseModel.findResponsible as vi.Mock).mockResolvedValue(mockResponsibleNurse);
      (NurseModel.findStaff as vi.Mock).mockResolvedValue(mockStaffNurses);
      (LeaveModel.findAll as vi.Mock).mockResolvedValue([]); // No leaves

      // 2. Create Shifts
      const mockCreatedShifts = [
        { id: 'shift1', date: '2025-10-01', type: 'day_8h' },
        { id: 'shift2', date: '2025-10-01', type: 'night_16h' },
        { id: 'shift3', date: '2025-10-02', type: 'day_8h' },
        { id: 'shift4', date: '2025-10-02', type: 'night_16h' },
      ];
      (ShiftModel.createMany as vi.Mock).mockResolvedValue(mockCreatedShifts);

      // 3. Assign Nurses
      (ShiftAssignmentModel.createMany as vi.Mock).mockResolvedValue(8); // 4 shifts * 2 assignments each

      // 4. Update Schedule
      (ScheduleModel.update as vi.Mock).mockResolvedValue({ id: 'schedule1' });

      // Act
      const result = await schedulerService.generateSchedule('schedule1', '2025-10');

      // Assert
      expect(result.success).toBe(true);
      expect(result.shifts).toBe(mockCreatedShifts.length);
      expect(result.assignments).toBeGreaterThan(0);
      expect(result.fairness_score).toBeGreaterThan(0);

      // Check if key methods were called
      expect(NurseModel.findResponsible).toHaveBeenCalledOnce();
      expect(NurseModel.findStaff).toHaveBeenCalledOnce();
      expect(ShiftModel.createMany).toHaveBeenCalledOnce();
      expect(ShiftAssignmentModel.createMany).toHaveBeenCalledOnce();
      expect(ScheduleModel.update).toHaveBeenCalledOnce();
    });

    it('should throw an error if no responsible nurse is found', async () => {
        // Arrange
        (NurseModel.findResponsible as vi.Mock).mockResolvedValue(null);
  
        // Act & Assert
        await expect(schedulerService.generateSchedule('schedule1', '2025-10')).rejects.toThrow('Sorumlu hemşire bulunamadı');
      });
  });

  describe('Algorithm Constraints', () => {
    it('should generate a schedule that respects leaves, rest periods, and consecutive day limits', async () => {
      // Arrange
      const scheduleId = 'schedule-respects-rules';
      const month = '2025-03'; // A month with 31 days

      // Mock date functions to have a predictable calendar
      const mockDates = Array.from({ length: 31 }, (_, i) => new Date(2025, 2, i + 1));
      (dateUtils.getMonthDates as vi.Mock).mockReturnValue(mockDates);
      (dateUtils.formatDate as vi.Mock).mockImplementation((date: Date) => date.toISOString().split('T')[0]);
      (dateUtils.isWeekend as vi.Mock).mockImplementation(d => [6, 0].includes(d.getDay()));
      (dateUtils.isHoliday as vi.Mock).mockReturnValue(false);

      const responsibleNurse = { id: 'resp1', name: 'Resp Nurse', role: 'responsible' };
      const staffNurses = [
        { id: 'staff1', name: 'A', role: 'staff' },
        { id: 'staff2', name: 'B', role: 'staff' },
        { id: 'staff3', name: 'C', role: 'staff' },
        { id: 'staff4', name: 'D', role: 'staff' },
      ];
      const nurseOnLeave = staffNurses[2]; // Nurse C is on leave
      const leaveStartDate = '2025-03-10';
      const leaveEndDate = '2025-03-11';

      (NurseModel.findResponsible as vi.Mock).mockResolvedValue(responsibleNurse);
      (NurseModel.findStaff as vi.Mock).mockResolvedValue(staffNurses);
      (LeaveModel.findAll as vi.Mock).mockResolvedValue([
        { nurseId: nurseOnLeave.id, startDate: leaveStartDate, endDate: leaveEndDate, type: 'annual' },
      ]);

      const createdShifts: Array<{ id: string; date: string; type: 'day_8h' | 'night_16h' | 'weekend_24h' }> = [];
      for (const date of mockDates) {
        const dateStr = date.toISOString().split('T')[0];
        const isWeekendDay = [6, 0].includes(date.getDay());

        if (isWeekendDay) {
          createdShifts.push({
            id: `shift-${createdShifts.length}`,
            date: dateStr,
            type: 'weekend_24h',
          });
        } else {
          createdShifts.push({
            id: `shift-${createdShifts.length}`,
            date: dateStr,
            type: 'day_8h',
          });
          createdShifts.push({
            id: `shift-${createdShifts.length}`,
            date: dateStr,
            type: 'night_16h',
          });
        }
      }
      (ShiftModel.createMany as vi.Mock).mockResolvedValue(createdShifts);
      (ScheduleModel.update as vi.Mock).mockResolvedValue({ id: scheduleId });

      const createManySpy = vi.spyOn(ShiftAssignmentModel, 'createMany');

      // Act
      await schedulerService.generateSchedule(scheduleId, month);

      // Assert
      expect(createManySpy).toHaveBeenCalledOnce();
      const generatedAssignments = createManySpy.mock.calls[0][0];

      // 1. Leave Constraint
      const assignmentsOnLeaveDate1 = generatedAssignments.filter(a => createdShifts.find(s => s.id === a.shift_id)?.date === leaveStartDate);
      const assignmentsOnLeaveDate2 = generatedAssignments.filter(a => createdShifts.find(s => s.id === a.shift_id)?.date === leaveEndDate);
      expect(assignmentsOnLeaveDate1.some(a => a.nurse_id === nurseOnLeave.id)).toBe(false);
      expect(assignmentsOnLeaveDate2.some(a => a.nurse_id === nurseOnLeave.id)).toBe(false);

      // 2. Post-Night Rest & Consecutive Days
      const nurseWorkDays: { [key: string]: string[] } = {};
      const nightShiftsByNurse: { [key: string]: Set<number> } = {};

      for (const assignment of generatedAssignments) {
        const shift = createdShifts.find(s => s.id === assignment.shift_id);
        if (!shift) continue;

        const day = parseInt(shift.date.split('-')[2]);

        if (!nurseWorkDays[assignment.nurse_id]) nurseWorkDays[assignment.nurse_id] = [];
        nurseWorkDays[assignment.nurse_id].push(shift.date);

        if (shift.type === 'night_16h') {
          if (!nightShiftsByNurse[assignment.nurse_id]) nightShiftsByNurse[assignment.nurse_id] = new Set();
          nightShiftsByNurse[assignment.nurse_id].add(day);
        }
      }

      for (const nurseId in nurseWorkDays) {
        const workDates = [...new Set(nurseWorkDays[nurseId])].map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
        
        let consecutiveDays = 1;
        for (let i = 0; i < workDates.length - 1; i++) {
          const diff = (workDates[i+1].getTime() - workDates[i].getTime()) / (1000 * 3600 * 24);
          if (diff === 1) {
            consecutiveDays++;
          } else {
            consecutiveDays = 1;
          }
          // 3. Consecutive Day Limit
          expect(consecutiveDays).toBeLessThanOrEqual(5);
        }

        // 2. Post-Night Rest
        const nightShiftDays = nightShiftsByNurse[nurseId] || new Set();
        for(const nightDay of nightShiftDays) {
            const workedNextDay = workDates.some(d => d.getDate() === nightDay + 1);
            expect(workedNextDay).toBe(false);
        }
      }
    });
  });
});
