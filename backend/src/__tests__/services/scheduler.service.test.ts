import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
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
    (dateUtils.parseMonth as Mock).mockImplementation((month: string) => {
      const [year, monthNum] = month.split('-').map(Number);
      return new Date(year, monthNum - 1, 1);
    });
    (dateUtils.getMonthDates as Mock).mockImplementation((year: number, month: number) => {
      const days = new Date(year, month + 1, 0).getDate();
      return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
    });
    (dateUtils.formatDate as Mock).mockImplementation((date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
    (dateUtils.isWeekend as Mock).mockImplementation((d: Date) => [6, 0].includes(d.getDay()));
    (dateUtils.isHoliday as Mock).mockReturnValue(false);
  });

  describe('generateSchedule', () => {
    it('should generate a schedule successfully under ideal conditions', async () => {
      // Arrange: Mock all model methods that will be called
      const mockDates = Array.from({ length: 31 }, (_, i) => new Date(2025, 9, i + 1));
      (dateUtils.getMonthDates as Mock).mockReturnValue(mockDates);
      (dateUtils.formatDate as Mock).mockImplementation((date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
      (dateUtils.isWeekend as Mock).mockReturnValue(false);
      (dateUtils.isHoliday as Mock).mockReturnValue(false);

      // 1. Initialize
      const mockResponsibleNurse = { id: 'resp1', name: 'Resp Nurse', role: 'responsible' };
      const mockStaffNurses = [
        { id: 'staff1', name: 'A', role: 'staff' },
        { id: 'staff2', name: 'B', role: 'staff' },
        { id: 'staff3', name: 'C', role: 'staff' },
        { id: 'staff4', name: 'D', role: 'staff' },
      ];
      (NurseModel.findResponsible as Mock).mockResolvedValue(mockResponsibleNurse);
      (NurseModel.findStaff as Mock).mockResolvedValue(mockStaffNurses);
      (LeaveModel.findAll as Mock).mockResolvedValue([]); // No leaves

      // 2. Create Shifts
      const mockCreatedShifts = [
        { id: 'shift1', date: '2025-10-01', type: 'day_8h' },
        { id: 'shift2', date: '2025-10-01', type: 'night_16h' },
        { id: 'shift3', date: '2025-10-02', type: 'day_8h' },
        { id: 'shift4', date: '2025-10-02', type: 'night_16h' },
      ];
      (ShiftModel.createMany as Mock).mockResolvedValue(mockCreatedShifts);

      // 3. Assign Nurses
      (ShiftAssignmentModel.createMany as Mock).mockResolvedValue(8); // 4 shifts * 2 assignments each

      // 4. Update Schedule
      (ScheduleModel.update as Mock).mockResolvedValue({ id: 'schedule1' });

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
        (NurseModel.findResponsible as Mock).mockResolvedValue(null);
  
        // Act & Assert
        await expect(schedulerService.generateSchedule('schedule1', '2025-10')).rejects.toThrow('Sorumlu hemşire bulunamadı');
      });

    it('should require at least two staff nurses', async () => {
      (NurseModel.findResponsible as Mock).mockResolvedValue({ id: 'resp', role: 'responsible' });
      (NurseModel.findStaff as Mock).mockResolvedValue([{ id: 'staff1', role: 'staff' }]);

      await expect(schedulerService.generateSchedule('schedule1', '2025-10'))
        .rejects.toThrow('En az 2 staf hemşire gerekli');
    });
  });

  describe('Algorithm Constraints', () => {
    it('should generate a schedule that respects leaves, rest periods, and consecutive day limits', async () => {
      // Arrange
      const scheduleId = 'schedule-respects-rules';
      const month = '2025-03'; // A month with 31 days

      // Mock date functions to have a predictable calendar
      const mockDates = Array.from({ length: 31 }, (_, i) => new Date(2025, 2, i + 1));
      (dateUtils.getMonthDates as Mock).mockReturnValue(mockDates);
      (dateUtils.formatDate as Mock).mockImplementation((date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
      (dateUtils.isWeekend as Mock).mockImplementation((d: Date) => [6, 0].includes(d.getDay()));
      (dateUtils.isHoliday as Mock).mockReturnValue(false);

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

      (NurseModel.findResponsible as Mock).mockResolvedValue(responsibleNurse);
      (NurseModel.findStaff as Mock).mockResolvedValue(staffNurses);
      (LeaveModel.findAll as Mock).mockResolvedValue([
        { nurseId: nurseOnLeave.id, startDate: leaveStartDate, endDate: leaveEndDate, type: 'annual' },
      ]);

      const createdShifts: Array<{ id: string; date: string; type: 'day_8h' | 'night_16h' | 'weekend_24h' }> = [];
      for (const date of mockDates) {
        // Format date using local timezone (same as the scheduler does)
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
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
      (ShiftModel.createMany as Mock).mockResolvedValue(createdShifts);
      (ScheduleModel.update as Mock).mockResolvedValue({ id: scheduleId });

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

  describe('internal helpers', () => {
    const buildDayInfo = (dateStr: string) => ({
      date: new Date(dateStr),
      dateStr,
      isWeekend: false,
      isHoliday: false,
    });

    it('computes warnings for heavy responsible leave usage and low staff hours', () => {
      const svc = schedulerService as unknown as {
        responsibleNurse: { id: string; name: string; role: string } | null;
        staffNurses: Array<{ id: string; name: string; role: string }>;
        leaves: any[];
        initializeNurseStats: () => void;
        nurseStats: Map<string, any>;
        getWarnings: () => string[];
      };

      svc.responsibleNurse = { id: 'resp', name: 'Rita', role: 'responsible' };
      svc.staffNurses = [
        { id: 's1', name: 'Ayşe', role: 'staff' },
        { id: 's2', name: 'Buse', role: 'staff' },
        { id: 's3', name: 'Ceyda', role: 'staff' },
      ];
      svc.initializeNurseStats();

      svc.leaves = Array.from({ length: 11 }, (_, idx) => ({
        nurse_id: 'resp',
        type: 'annual',
        start_date: `2025-01-${String(idx + 1).padStart(2, '0')}`,
        end_date: `2025-01-${String(idx + 1).padStart(2, '0')}`,
      }));

      const statsMap = svc.nurseStats;
      statsMap.get('s1').totalHours = 120;
      statsMap.get('s2').totalHours = 120;
      statsMap.get('s3').totalHours = 20;

      const warnings = svc.getWarnings();
      expect(warnings.some((w) => w.includes('Sorumlu hemşire'))).toBe(true);
      expect(warnings.some((w) => w.includes('Ceyda'))).toBe(true);
    });

    it('evaluates leave overlap and night eligibility rules', () => {
      const svc = schedulerService as unknown as {
        staffNurses: Array<{ id: string; name: string; role: string }>;
        leaves: any[];
        initializeNurseStats: () => void;
        nurseStats: Map<string, any>;
        isNurseOnLeave: (nurseId: string, date: string) => boolean;
        getEligibleStaffForNight: (day: ReturnType<typeof buildDayInfo>) => Array<{ id: string }>;
      };

      svc.staffNurses = [
        { id: 'n1', name: 'Ali', role: 'staff' },
        { id: 'n2', name: 'Berna', role: 'staff' },
        { id: 'n3', name: 'Can', role: 'staff' },
        { id: 'n4', name: 'Deniz', role: 'staff' },
      ];
      svc.initializeNurseStats();

      svc.leaves = [
        { nurse_id: 'n1', type: 'preference', start_date: '2025-02-10', end_date: '2025-02-12' },
        { nurseId: 'n1', startDate: '2025-02-15', endDate: '2025-02-16', type: 'annual' },
        { nurse_id: 'n2', type: 'annual', start_date: '2025-02-05', end_date: '2025-02-05' },
        { nurse_id: 'n3', type: 'annual', start_date: '2025-02-06' }, // missing end date ignored
      ];

      expect(svc.isNurseOnLeave('n1', '2025-02-11')).toBe(false); // preference ignored
      expect(svc.isNurseOnLeave('n1', '2025-02-15')).toBe(true);
      expect(svc.isNurseOnLeave('n3', '2025-02-06')).toBe(false);

      const statsMap = svc.nurseStats;
      statsMap.get('n1').lastShiftDate = new Date('2025-02-04');
      statsMap.get('n1').nightShiftCount = 1;
      statsMap.get('n2').consecutiveDays = 5;
      statsMap.get('n3').nightShiftCount = 10;

      const eligible = svc.getEligibleStaffForNight(buildDayInfo('2025-02-05'));
      expect(eligible.map((n) => n.id)).toEqual(['n4']);
    });
  });
});
