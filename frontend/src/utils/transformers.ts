import {
  ApiDaySchedule,
  ApiFairnessScore,
  ApiLeave,
  ApiMonthlyStats,
  ApiNurse,
  ApiNurseMonthlyStats,
  ApiSchedule,
  ApiScheduleDetail,
  ApiShift,
  ApiShiftAssignment,
  ApiValidationResult,
  DaySchedule,
  FairnessScore,
  Leave,
  MonthlyStats,
  Nurse,
  NurseMonthlyStats,
  Schedule,
  ScheduleListItem,
  Shift,
  ShiftAssignment,
  ValidationResult
} from '../types/entities';

const monthToKey = (month: string) => month.slice(0, 7);

const mapAssignment = (assignment: ApiShiftAssignment): ShiftAssignment => ({
  id: assignment.id,
  shiftId: assignment.shift_id,
  nurseId: assignment.nurse_id,
  nurseName: assignment.nurse_name,
  nurseRole: assignment.nurse_role,
  assignmentRole: assignment.assignment_role,
  assignedBy: assignment.assigned_by,
  createdAt: assignment.created_at
});

const mapShift = (shift: ApiShift): Shift => ({
  id: shift.id,
  scheduleId: shift.schedule_id,
  date: shift.date,
  type: shift.type,
  startTime: shift.start_time,
  endTime: shift.end_time,
  requiredStaff: shift.required_staff,
  requiresResponsible: shift.requires_responsible,
  createdAt: shift.created_at,
  assignments: shift.assignments?.map(mapAssignment) ?? [],
  isComplete: shift.is_complete,
  currentStaff: shift.current_staff,
  currentResponsible: shift.current_responsible,
  statusMessage: shift.status_message ?? undefined
});

const mapDay = (day: ApiDaySchedule): DaySchedule => ({
  date: day.date,
  isWeekend: day.is_weekend,
  isHoliday: day.is_holiday,
  shifts: day.shifts.map(mapShift)
});

const mapBaseSchedule = (schedule: ApiSchedule): ScheduleListItem => ({
  id: schedule.id,
  month: monthToKey(schedule.month),
  status: schedule.status,
  fairnessScore: schedule.fairness_score,
  createdAt: schedule.created_at,
  updatedAt: schedule.updated_at
});

const mapFairnessScore = (score?: ApiFairnessScore | null): FairnessScore => ({
  overall: Number(score?.fairness_score ?? 0),
  hoursScore: Number(score?.hours_score ?? 0),
  nightsScore: Number(score?.nights_score ?? 0),
  weekendsScore: Number(score?.weekends_score ?? 0),
  hoursStdDev: Number(score?.hours_std_dev ?? 0),
  nightsStdDev: Number(score?.nights_std_dev ?? 0),
  weekendsStdDev: Number(score?.weekends_std_dev ?? 0)
});

const mapNurseStats = (stats: ApiNurseMonthlyStats): NurseMonthlyStats => ({
  nurseId: stats.nurse_id,
  nurseName: stats.nurse_name,
  nurseRole: stats.nurse_role,
  scheduleId: stats.schedule_id,
  month: monthToKey(stats.month),
  totalHours: stats.total_hours,
  nightShiftCount: stats.night_shift_count,
  weekendShiftCount: stats.weekend_shift_count,
  totalShiftCount: stats.total_shift_count,
  dayShiftCount: stats.day_shift_count
});

export const mapNurse = (nurse: ApiNurse): Nurse => ({
  id: nurse.id,
  name: nurse.name,
  role: nurse.role,
  createdAt: nurse.created_at,
  updatedAt: nurse.updated_at
});

export const mapLeave = (leave: ApiLeave): Leave => ({
  id: leave.id,
  nurseId: leave.nurse_id,
  nurseName: leave.nurse_name,
  type: leave.type,
  startDate: leave.start_date,
  endDate: leave.end_date,
  notes: leave.notes,
  createdAt: leave.created_at
});

export const mapScheduleList = (items: ApiSchedule[]): ScheduleListItem[] =>
  items.map(mapBaseSchedule);

export const mapScheduleDetail = (detail: ApiScheduleDetail): Schedule => ({
  ...mapBaseSchedule(detail),
  days: detail.days.map(mapDay),
  stats: {
    totalDays: detail.stats.total_days,
    completeShifts: detail.stats.complete_shifts,
    incompleteShifts: detail.stats.incomplete_shifts
  },
  warnings: detail.warnings ?? [],
  generationTimeMs: detail.generation_time_ms ?? undefined
});

export const mapMonthlyStats = (stats: ApiMonthlyStats): MonthlyStats => ({
  scheduleId: stats.schedule_id,
  month: monthToKey(stats.month),
  fairnessScore: mapFairnessScore(stats.fairness_score),
  nurses: stats.nurses.map(mapNurseStats),
  averages: {
    staffAvgHours: stats.averages.staff_avg_hours,
    staffAvgNights: stats.averages.staff_avg_nights,
    staffAvgWeekends: stats.averages.staff_avg_weekends
  }
});

export const mapValidationResult = (result: ApiValidationResult): ValidationResult => ({
  isValid: result.is_valid,
  errors: result.errors,
  warnings: result.warnings,
  completeness: {
    totalShifts: result.completeness.total_shifts,
    completeShifts: result.completeness.complete_shifts,
    percentage: result.completeness.percentage
  }
});

export const mapShiftFromList = (shift: ApiShift): Shift => mapShift(shift);

export const mapAssignments = (assignments: ApiShiftAssignment[]): ShiftAssignment[] =>
  assignments.map(mapAssignment);

