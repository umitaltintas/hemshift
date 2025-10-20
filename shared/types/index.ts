// Shared TypeScript types for Shift Planner
// Used by both frontend and backend

// =============================================================================
// NURSE TYPES
// =============================================================================

export type NurseRole = 'responsible' | 'staff'

export interface Nurse {
  id: string
  name: string
  role: NurseRole
  created_at: string
  updated_at: string
}

export interface CreateNurseInput {
  name: string
  role: NurseRole
}

export interface UpdateNurseInput {
  name?: string
}

// =============================================================================
// LEAVE TYPES
// =============================================================================

export type LeaveType = 'annual' | 'excuse' | 'sick' | 'preference'

export interface Leave {
  id: string
  nurse_id: string
  nurse_name?: string
  type: LeaveType
  start_date: string // YYYY-MM-DD
  end_date: string   // YYYY-MM-DD
  notes?: string
  created_at: string
}

export interface CreateLeaveInput {
  nurse_id: string
  type: LeaveType
  start_date: string
  end_date: string
  notes?: string
}

export interface UpdateLeaveInput {
  type?: LeaveType
  start_date?: string
  end_date?: string
  notes?: string
}

// =============================================================================
// SCHEDULE TYPES
// =============================================================================

export type ScheduleStatus = 'draft' | 'published' | 'archived'

export interface Schedule {
  id: string
  month: string // YYYY-MM-01
  status: ScheduleStatus
  fairness_score?: number
  created_at: string
  updated_at: string
}

export interface CreateScheduleInput {
  month: string // YYYY-MM
}

export interface UpdateScheduleInput {
  status?: ScheduleStatus
  fairness_score?: number
}

// =============================================================================
// SHIFT TYPES
// =============================================================================

export type ShiftType = 'day_8h' | 'night_16h' | 'weekend_24h'

export interface Shift {
  id: string
  schedule_id: string
  date: string // YYYY-MM-DD
  type: ShiftType
  start_time: string // HH:mm
  end_time: string   // HH:mm
  required_staff: number
  requires_responsible: boolean
  created_at: string
}

export interface CreateShiftInput {
  schedule_id: string
  date: string
  type: ShiftType
  start_time: string
  end_time: string
  required_staff?: number
}

// =============================================================================
// SHIFT ASSIGNMENT TYPES
// =============================================================================

export type AssignmentRole = 'responsible' | 'staff'
export type AssignedBy = 'algorithm' | 'manual'

export interface ShiftAssignment {
  id: string
  shift_id: string
  nurse_id: string
  nurse_name?: string
  nurse_role?: NurseRole
  assignment_role: AssignmentRole
  assigned_by: AssignedBy
  created_at: string
}

export interface CreateAssignmentInput {
  nurse_id: string
}

// =============================================================================
// CONSTRAINT TYPES
// =============================================================================

export type ConstraintType =
  | 'max_consecutive_days'
  | 'min_rest_after_night'
  | 'max_consecutive_nights'
  | 'max_night_shifts_per_month'
  | 'max_weekend_shifts_per_month'

export interface Constraint {
  id: string
  name: string
  type: ConstraintType
  value: number
  is_active: boolean
}

// =============================================================================
// STATISTICS TYPES
// =============================================================================

export interface NurseMonthlyStats {
  nurse_id: string
  nurse_name: string
  nurse_role: NurseRole
  schedule_id: string
  month: string
  total_hours: number
  night_shift_count: number
  weekend_shift_count: number
  total_shift_count: number
  day_shift_count: number
}

export interface FairnessScore {
  overall: number
  hours_score: number
  nights_score: number
  weekends_score: number
  hours_std_dev: number
  nights_std_dev: number
  weekends_std_dev: number
}

export interface MonthlyStatistics {
  schedule_id: string
  month: string
  fairness_score: FairnessScore
  nurses: NurseMonthlyStats[]
  averages: {
    staff_avg_hours: number
    staff_avg_nights: number
    staff_avg_weekends: number
  }
}

// =============================================================================
// SCHEDULE DETAIL TYPES (with nested data)
// =============================================================================

export interface ShiftWithAssignments extends Shift {
  assignments: ShiftAssignment[]
  is_complete?: boolean
  current_staff?: number
  current_responsible?: number
  status_message?: string
}

export interface DaySchedule {
  date: string
  is_weekend: boolean
  is_holiday: boolean
  shifts: ShiftWithAssignments[]
}

export interface ScheduleDetail extends Schedule {
  days: DaySchedule[]
  stats?: {
    total_days: number
    complete_shifts: number
    incomplete_shifts: number
  }
}

// =============================================================================
// GENERATION TYPES
// =============================================================================

export interface GenerateScheduleInput {
  month: string // YYYY-MM
}

export interface GenerateScheduleResult {
  schedule: Schedule
  warnings: string[]
  generation_time_ms: number
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface ValidationResult {
  is_valid: boolean
  errors: string[]
  warnings: string[]
  completeness: {
    total_shifts: number
    complete_shifts: number
    percentage: number
  }
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}
