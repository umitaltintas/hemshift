export type NurseRole = 'responsible' | 'staff';

export interface ApiNurse {
  id: string;
  name: string;
  role: NurseRole;
  created_at: string;
  updated_at: string;
}

export interface Nurse {
  id: string;
  name: string;
  role: NurseRole;
  createdAt: string;
  updatedAt: string;
}

export type LeaveType = 'annual' | 'excuse' | 'sick' | 'preference';

export interface ApiLeave {
  id: string;
  nurse_id: string;
  nurse_name: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  notes: string | null;
  created_at: string;
}

export interface Leave {
  id: string;
  nurseId: string;
  nurseName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  notes: string | null;
  createdAt: string;
}

export type ShiftType = 'day_8h' | 'night_16h' | 'weekend_24h';

export type AssignmentRole = 'responsible' | 'staff';
export type AssignmentSource = 'algorithm' | 'manual';

export interface ApiShiftAssignment {
  id: string;
  shift_id: string;
  nurse_id: string;
  nurse_name: string;
  nurse_role: NurseRole;
  assignment_role: AssignmentRole;
  assigned_by: AssignmentSource;
  created_at: string;
}

export interface ShiftAssignment {
  id: string;
  shiftId: string;
  nurseId: string;
  nurseName: string;
  nurseRole: NurseRole;
  assignmentRole: AssignmentRole;
  assignedBy: AssignmentSource;
  createdAt: string;
}

export interface ApiShift {
  id: string;
  schedule_id: string;
  date: string;
  type: ShiftType;
  start_time: string;
  end_time: string;
  required_staff: number;
  requires_responsible: boolean;
  created_at: string;
  assignments: ApiShiftAssignment[];
  is_complete?: boolean;
  current_staff?: number;
  current_responsible?: number;
  status_message?: string | null;
}

export interface Shift {
  id: string;
  scheduleId: string;
  date: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
  requiredStaff: number;
  requiresResponsible: boolean;
  createdAt: string;
  assignments: ShiftAssignment[];
  isComplete?: boolean;
  currentStaff?: number;
  currentResponsible?: number;
  statusMessage?: string | null;
}

export interface ApiDaySchedule {
  date: string;
  is_weekend: boolean;
  is_holiday: boolean;
  shifts: ApiShift[];
}

export interface DaySchedule {
  date: string;
  isWeekend: boolean;
  isHoliday: boolean;
  shifts: Shift[];
}

export interface ApiScheduleStats {
  total_days: number;
  complete_shifts: number;
  incomplete_shifts: number;
}

export interface ScheduleStats {
  totalDays: number;
  completeShifts: number;
  incompleteShifts: number;
}

export type ScheduleStatus = 'draft' | 'published' | 'archived';

export interface ApiSchedule {
  id: string;
  month: string;
  status: ScheduleStatus;
  fairness_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleListItem {
  id: string;
  month: string;
  status: ScheduleStatus;
  fairnessScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiScheduleDetail extends ApiSchedule {
  days: ApiDaySchedule[];
  stats: ApiScheduleStats;
  warnings?: string[];
  generation_time_ms?: number;
}

export interface Schedule extends ScheduleListItem {
  days: DaySchedule[];
  stats: ScheduleStats;
  warnings?: string[];
  generationTimeMs?: number;
}

export interface ApiFairnessScore {
  fairness_score: number | null;
  hours_score: number | null;
  nights_score: number | null;
  weekends_score: number | null;
  hours_std_dev: number | null;
  nights_std_dev: number | null;
  weekends_std_dev: number | null;
}

export interface FairnessScore {
  overall: number;
  hoursScore: number;
  nightsScore: number;
  weekendsScore: number;
  hoursStdDev: number;
  nightsStdDev: number;
  weekendsStdDev: number;
}

export interface ApiNurseMonthlyStats {
  nurse_id: string;
  nurse_name: string;
  nurse_role: NurseRole;
  schedule_id: string;
  month: string;
  total_hours: number;
  night_shift_count: number;
  weekend_shift_count: number;
  total_shift_count: number;
  day_shift_count: number;
}

export interface NurseMonthlyStats {
  nurseId: string;
  nurseName: string;
  nurseRole: NurseRole;
  scheduleId: string;
  month: string;
  totalHours: number;
  nightShiftCount: number;
  weekendShiftCount: number;
  totalShiftCount: number;
  dayShiftCount: number;
}

export interface ApiMonthlyStats {
  schedule_id: string;
  month: string;
  fairness_score: ApiFairnessScore;
  nurses: ApiNurseMonthlyStats[];
  averages: {
    staff_avg_hours: number;
    staff_avg_nights: number;
    staff_avg_weekends: number;
  };
}

export interface MonthlyStats {
  scheduleId: string;
  month: string;
  fairnessScore: FairnessScore;
  nurses: NurseMonthlyStats[];
  averages: {
    staffAvgHours: number;
    staffAvgNights: number;
    staffAvgWeekends: number;
  };
}

export interface ApiValidationResult {
  is_valid: boolean;
  errors?: string[];
  warnings?: string[];
  validation: {
    total_shifts: number;
    complete_shifts: number;
    incomplete_shifts: number;
    issues: string[];
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  completeness: {
    totalShifts: number;
    completeShifts: number;
    incompleteShifts: number;
    issues: string[];
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  message?: string;
}

