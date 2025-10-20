export type NurseRole = 'responsible' | 'staff'

export interface ApiNurse {
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

export type LeaveType = 'annual' | 'excuse' | 'sick' | 'preference'

export interface ApiLeave {
  id: string
  nurse_id: string
  nurse_name: string
  type: LeaveType
  start_date: string
  end_date: string
  notes: string | null
  created_at: string
}

export interface CreateLeaveInput {
  nurse_id: string
  type: LeaveType
  start_date: string
  end_date: string
  notes?: string | null
}

export interface UpdateLeaveInput {
  type?: LeaveType
  start_date?: string
  end_date?: string
  notes?: string | null
}

export type ShiftType = 'day_8h' | 'night_16h' | 'weekend_24h'
export type AssignmentRole = 'responsible' | 'staff'
export type AssignmentSource = 'algorithm' | 'manual'

export interface ApiShiftAssignment {
  id: string
  shift_id: string
  nurse_id: string
  nurse_name: string
  nurse_role: NurseRole
  assignment_role: AssignmentRole
  assigned_by: AssignmentSource
  created_at: string
}

export interface CreateAssignmentInput {
  nurse_id: string
}

export interface ApiShift {
  id: string
  schedule_id: string
  date: string
  type: ShiftType
  start_time: string
  end_time: string
  required_staff: number
  requires_responsible: boolean
  created_at: string
  assignments: ApiShiftAssignment[]
  is_complete?: boolean
  current_staff?: number
  current_responsible?: number
  status_message?: string | null
}

export interface CreateShiftInput {
  schedule_id: string
  date: string
  type: ShiftType
  start_time: string
  end_time: string
  required_staff?: number
}

export interface ApiDaySchedule {
  date: string
  is_weekend: boolean
  is_holiday: boolean
  shifts: ApiShift[]
}

export type ScheduleStatus = 'draft' | 'published' | 'archived'

export interface ApiSchedule {
  id: string
  month: string
  status: ScheduleStatus
  fairness_score: number | null
  created_at: string
  updated_at: string
}

export interface ApiScheduleDetail extends ApiSchedule {
  days: ApiDaySchedule[]
  stats: {
    total_days: number
    complete_shifts: number
    incomplete_shifts: number
  }
  warnings?: string[]
  generation_time_ms?: number
}

export interface CreateScheduleInput {
  month: string
}

export interface UpdateScheduleInput {
  status?: ScheduleStatus
  fairness_score?: number | null
}

export type ShiftWithAssignments = ApiShift
export type DaySchedule = ApiDaySchedule
export type ScheduleDetail = ApiScheduleDetail

export interface FairnessScoreRow {
  fairness_score: number | null
  hours_score: number | null
  nights_score: number | null
  weekends_score: number | null
  hours_std_dev: number | null
  nights_std_dev: number | null
  weekends_std_dev: number | null
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
