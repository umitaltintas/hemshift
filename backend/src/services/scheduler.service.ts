/**
 * Core Scheduling Algorithm Service
 *
 * This service implements the constraint-based scheduling algorithm
 * with fairness optimization for nurse shift planning.
 */

import { NurseModel } from '../models/Nurse.js'
import { LeaveModel } from '../models/Leave.js'
import { ShiftModel, ShiftAssignmentModel } from '../models/Shift.js'
import { ScheduleModel } from '../models/Schedule.js'
import type { ApiNurse, ApiLeave, ShiftType } from '../types/api.js'
import {
  getMonthDates,
  formatDate,
  isWeekend,
  isHoliday
} from '../utils/dateUtils.js'
import {
  mean,
  standardDeviation,
  calculateFairnessScore
} from '../utils/fairnessCalculator.js'

// =============================================================================
// TYPES
// =============================================================================

interface DayInfo {
  date: Date
  dateStr: string
  isWeekend: boolean
  isHoliday: boolean
}

interface NurseStats {
  nurse: ApiNurse
  totalHours: number
  nightShiftCount: number
  weekendShiftCount: number
  dayShiftCount: number
  consecutiveDays: number
  lastShiftDate: Date | null
}

interface ShiftNeed {
  date: string
  type: ShiftType
  startTime: string
  endTime: string
  requiredStaff: number
  requiresResponsible: boolean
}

interface Assignment {
  shift_id: string
  nurse_id: string
  assigned_by: 'algorithm'
}

// =============================================================================
// SCHEDULER SERVICE
// =============================================================================

export class SchedulerService {
  private responsibleNurse: ApiNurse | null = null
  private staffNurses: ApiNurse[] = []
  private leaves: ApiLeave[] = []
  private nurseStats: Map<string, NurseStats> = new Map()
  private scheduleId: string = ''
  private monthDates: DayInfo[] = []

  /**
   * Main entry point: Generate schedule for a month
   */
  async generateSchedule(scheduleId: string, month: string) {
    console.log(`[SCHEDULER] Starting schedule generation for ${month}`)
    const startTime = Date.now()

    this.scheduleId = scheduleId

    try {
      // Phase 1: Initialization
      await this.initialize(month)

      // Phase 2: Create shifts
      const shifts = await this.createShifts()

      // Phase 3: Assign nurses to shifts
      const assignments = await this.assignNursesToShifts(shifts)

      // Phase 4: Calculate fairness score
      const fairnessScore = this.calculateFinalFairnessScore()

      // Phase 5: Update schedule with fairness score
      await ScheduleModel.update(scheduleId, { fairness_score: fairnessScore.overall })

      const generationTime = Date.now() - startTime

      console.log(`[SCHEDULER] Schedule generated successfully in ${generationTime}ms`)
      console.log(`[SCHEDULER] Fairness score: ${fairnessScore.overall.toFixed(2)}`)

      return {
        success: true,
        fairness_score: fairnessScore.overall,
        shifts: shifts.length,
        assignments: assignments.length,
        generation_time_ms: generationTime,
        warnings: this.getWarnings()
      }
    } catch (error) {
      console.error('[SCHEDULER] Error:', error)
      throw error
    }
  }

  /**
   * Phase 1: Initialize data
   */
  private async initialize(month: string) {
    console.log('[SCHEDULER] Phase 1: Initialization')

    // Get responsible nurse
    this.responsibleNurse = await NurseModel.findResponsible()
    if (!this.responsibleNurse) {
      throw new Error('Sorumlu hemşire bulunamadı')
    }

    // Get staff nurses
    this.staffNurses = await NurseModel.findStaff()
    if (this.staffNurses.length < 2) {
      throw new Error('En az 2 staf hemşire gerekli')
    }

    console.log(`[SCHEDULER] Found 1 responsible + ${this.staffNurses.length} staff nurses`)

    // Get leaves for this month
    this.leaves = await LeaveModel.findAll({ month })
    console.log(`[SCHEDULER] Found ${this.leaves.length} leaves`)

    // Initialize month dates
    const [year, monthNum] = month.split('-').map(Number)
    const dates = getMonthDates(year, monthNum - 1)

    this.monthDates = dates.map((date) => ({
      date,
      dateStr: formatDate(date),
      isWeekend: isWeekend(date),
      isHoliday: isHoliday(date)
    }))

    console.log(`[SCHEDULER] Processing ${this.monthDates.length} days`)

    // Initialize nurse stats
    this.initializeNurseStats()
  }

  /**
   * Initialize nurse statistics tracking
   */
  private initializeNurseStats() {
    // Initialize stats for all staff nurses
    for (const nurse of this.staffNurses) {
      this.nurseStats.set(nurse.id, {
        nurse,
        totalHours: 0,
        nightShiftCount: 0,
        weekendShiftCount: 0,
        dayShiftCount: 0,
        consecutiveDays: 0,
        lastShiftDate: null
      })
    }
  }

  /**
   * Phase 2: Create shifts for all days
   */
  private async createShifts(): Promise<Array<ShiftNeed & { id: string }>> {
    console.log('[SCHEDULER] Phase 2: Creating shifts')

    const shiftsToCreate: ShiftNeed[] = []

    for (const day of this.monthDates) {
      if (day.isWeekend || day.isHoliday) {
        // Weekend/Holiday: 24-hour shift
        shiftsToCreate.push({
          date: day.dateStr,
          type: 'weekend_24h',
          startTime: '00:00',
          endTime: '24:00',
          requiredStaff: 2,
          requiresResponsible: false
        })
      } else {
        // Weekday: 8h day + 16h night
        shiftsToCreate.push({
          date: day.dateStr,
          type: 'day_8h',
          startTime: '08:00',
          endTime: '16:00',
          requiredStaff: 2,
          requiresResponsible: true
        })

        shiftsToCreate.push({
          date: day.dateStr,
          type: 'night_16h',
          startTime: '16:00',
          endTime: '08:00',
          requiredStaff: 2,
          requiresResponsible: false
        })
      }
    }

    // Bulk insert shifts
    const createdShifts = await ShiftModel.createMany(
      shiftsToCreate.map((shift) => ({
        schedule_id: this.scheduleId,
        date: shift.date,
        type: shift.type,
        start_time: shift.startTime,
        end_time: shift.endTime,
        required_staff: shift.requiredStaff
      }))
    )

    console.log(`[SCHEDULER] Created ${createdShifts.length} shifts`)

    return createdShifts.map((shift, index) => ({
      ...shiftsToCreate[index],
      id: shift.id
    }))
  }

  /**
   * Phase 3: Assign nurses to shifts
   */
  private async assignNursesToShifts(
    shifts: Array<ShiftNeed & { id: string }>
  ): Promise<Assignment[]> {
    console.log('[SCHEDULER] Phase 3: Assigning nurses to shifts')

    const assignments: Assignment[] = []

    // Group shifts by date
    const shiftsByDate = new Map<string, Array<ShiftNeed & { id: string }>>()
    for (const shift of shifts) {
      if (!shiftsByDate.has(shift.date)) {
        shiftsByDate.set(shift.date, [])
      }
      shiftsByDate.get(shift.date)!.push(shift)
    }

    // Process each day
    for (const day of this.monthDates) {
      const dayShifts = shiftsByDate.get(day.dateStr) || []

      for (const shift of dayShifts) {
        if (shift.type === 'day_8h') {
          // Assign 2 staff + 1 responsible
          const dayAssignments = this.assign8HourShift(shift, day)
          assignments.push(...dayAssignments)
        } else if (shift.type === 'night_16h') {
          // Assign 2 staff
          const nightAssignments = this.assign16HourShift(shift, day)
          assignments.push(...nightAssignments)
        } else if (shift.type === 'weekend_24h') {
          // Assign 2 staff
          const weekendAssignments = this.assign24HourShift(shift, day)
          assignments.push(...weekendAssignments)
        }
      }
    }

    // Bulk insert assignments
    await ShiftAssignmentModel.createMany(assignments)

    console.log(`[SCHEDULER] Created ${assignments.length} assignments`)

    return assignments
  }

  /**
   * Assign nurses to 8-hour day shift
   * Requirement: 2 STAFF + 1 RESPONSIBLE
   */
  private assign8HourShift(
    shift: ShiftNeed & { id: string },
    day: DayInfo
  ): Assignment[] {
    const assignments: Assignment[] = []

    // 1. Assign responsible nurse (if not on leave)
    if (this.responsibleNurse && !this.isNurseOnLeave(this.responsibleNurse.id, day.dateStr)) {
      assignments.push({
        shift_id: shift.id,
        nurse_id: this.responsibleNurse.id,
        assigned_by: 'algorithm'
      })
    }

    // 2. Assign 2 staff nurses
    const eligibleStaff = this.getEligibleStaffForDay(day, 'day')
    const selectedStaff = this.selectNursesByPriority(eligibleStaff, day, 2)

    for (const nurse of selectedStaff) {
      assignments.push({
        shift_id: shift.id,
        nurse_id: nurse.id,
        assigned_by: 'algorithm'
      })

      // Update stats
      this.updateNurseStats(nurse.id, {
        hours: 8,
        isNight: false,
        isWeekend: day.isWeekend,
        date: day.date
      })
    }

    return assignments
  }

  /**
   * Assign nurses to 16-hour night shift
   * Requirement: 2 STAFF
   */
  private assign16HourShift(
    shift: ShiftNeed & { id: string },
    day: DayInfo
  ): Assignment[] {
    const assignments: Assignment[] = []

    const eligibleStaff = this.getEligibleStaffForNight(day)
    const selectedStaff = this.selectNursesByPriority(eligibleStaff, day, 2)

    for (const nurse of selectedStaff) {
      assignments.push({
        shift_id: shift.id,
        nurse_id: nurse.id,
        assigned_by: 'algorithm'
      })

      // Update stats
      this.updateNurseStats(nurse.id, {
        hours: 16,
        isNight: true,
        isWeekend: day.isWeekend,
        date: day.date
      })
    }

    return assignments
  }

  /**
   * Assign nurses to 24-hour weekend shift
   * Requirement: 2 STAFF
   */
  private assign24HourShift(
    shift: ShiftNeed & { id: string },
    day: DayInfo
  ): Assignment[] {
    const assignments: Assignment[] = []

    const eligibleStaff = this.getEligibleStaffForWeekend(day)
    const selectedStaff = this.selectNursesByPriority(eligibleStaff, day, 2)

    for (const nurse of selectedStaff) {
      assignments.push({
        shift_id: shift.id,
        nurse_id: nurse.id,
        assigned_by: 'algorithm'
      })

      // Update stats
      this.updateNurseStats(nurse.id, {
        hours: 24,
        isNight: true,
        isWeekend: true,
        date: day.date
      })
    }

    return assignments
  }

  /**
   * Get eligible staff nurses for day shift
   */
  private getEligibleStaffForDay(day: DayInfo, _shiftType: 'day' | 'night' = 'day'): ApiNurse[] {
    return this.staffNurses.filter((nurse) => {
      // On leave?
      if (this.isNurseOnLeave(nurse.id, day.dateStr)) {
        return false
      }

      // Already assigned today?
      if (this.isNurseAssignedOnDate(nurse.id, day.dateStr)) {
        return false
      }

      const stats = this.nurseStats.get(nurse.id)!

      // Consecutive days limit (max 5)
      if (stats.consecutiveDays >= 5) {
        return false
      }

      return true
    })
  }

  /**
   * Get eligible staff nurses for night shift
   */
  private getEligibleStaffForNight(day: DayInfo): ApiNurse[] {
    return this.staffNurses.filter((nurse) => {
      // On leave?
      if (this.isNurseOnLeave(nurse.id, day.dateStr)) {
        return false
      }

      // Already assigned today?
      if (this.isNurseAssignedOnDate(nurse.id, day.dateStr)) {
        return false
      }

      const stats = this.nurseStats.get(nurse.id)!

      // Worked night yesterday? (rest period)
      if (stats.lastShiftDate) {
        const yesterday = new Date(day.date)
        yesterday.setDate(yesterday.getDate() - 1)
        const lastShiftStr = formatDate(stats.lastShiftDate)
        const yesterdayStr = formatDate(yesterday)

        if (lastShiftStr === yesterdayStr && stats.nightShiftCount > 0) {
          // Need rest after night shift
          return false
        }
      }

      // Consecutive days limit
      if (stats.consecutiveDays >= 5) {
        return false
      }

      // Too many night shifts this month?
      if (stats.nightShiftCount >= 10) {
        return false
      }

      return true
    })
  }

  /**
   * Get eligible staff nurses for weekend shift
   */
  private getEligibleStaffForWeekend(day: DayInfo): ApiNurse[] {
    return this.staffNurses.filter((nurse) => {
      // On leave?
      if (this.isNurseOnLeave(nurse.id, day.dateStr)) {
        return false
      }

      const stats = this.nurseStats.get(nurse.id)!

      // Worked yesterday? (need rest after previous shift)
      if (stats.lastShiftDate) {
        const yesterday = new Date(day.date)
        yesterday.setDate(yesterday.getDate() - 1)
        const lastShiftStr = formatDate(stats.lastShiftDate)
        const yesterdayStr = formatDate(yesterday)

        if (lastShiftStr === yesterdayStr) {
          return false
        }
      }

      // Too many weekend shifts?
      if (stats.weekendShiftCount >= 4) {
        return false
      }

      return true
    })
  }

  /**
   * Select nurses by priority score
   * Lower score = higher priority
   */
  private selectNursesByPriority(
    nurses: ApiNurse[],
    day: DayInfo,
    count: number
  ): ApiNurse[] {
    const scored = nurses.map((nurse) => ({
      nurse,
      score: this.calculatePriorityScore(nurse, day)
    }))

    // Sort by score (ascending - lower is better)
    scored.sort((a, b) => a.score - b.score)

    return scored.slice(0, count).map((s) => s.nurse)
  }

  /**
   * Calculate priority score for a nurse
   * Lower score = higher priority (should be assigned)
   */
  private calculatePriorityScore(nurse: ApiNurse, day: DayInfo): number {
    const stats = this.nurseStats.get(nurse.id)!
    let score = 0

    // 1. Total hours (less hours = higher priority)
    const avgHours = mean(
      Array.from(this.nurseStats.values()).map((s) => s.totalHours)
    )
    score += (stats.totalHours - avgHours) * 10

    // 2. Night shift count (less nights = higher priority)
    const avgNights = mean(
      Array.from(this.nurseStats.values()).map((s) => s.nightShiftCount)
    )
    score += (stats.nightShiftCount - avgNights) * 20

    // 3. Weekend shift count (less weekends = higher priority)
    const avgWeekends = mean(
      Array.from(this.nurseStats.values()).map((s) => s.weekendShiftCount)
    )
    score += (stats.weekendShiftCount - avgWeekends) * 15

    // 4. Days since last shift (more days = higher priority)
    if (stats.lastShiftDate) {
      const daysSinceLastShift = Math.floor(
        (day.date.getTime() - stats.lastShiftDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      score -= daysSinceLastShift * 2
    } else {
      // Never worked = highest priority
      score -= 50
    }

    // 5. Consecutive days penalty
    score += stats.consecutiveDays * 5

    return score
  }

  /**
   * Update nurse statistics
   */
  private updateNurseStats(
    nurseId: string,
    update: {
      hours: number
      isNight: boolean
      isWeekend: boolean
      date: Date
    }
  ) {
    const stats = this.nurseStats.get(nurseId)!

    stats.totalHours += update.hours
    stats.dayShiftCount++

    if (update.isNight) {
      stats.nightShiftCount++
    }

    if (update.isWeekend) {
      stats.weekendShiftCount++
    }

    // Update consecutive days
    if (stats.lastShiftDate) {
      const yesterday = new Date(update.date)
      yesterday.setDate(yesterday.getDate() - 1)

      if (formatDate(stats.lastShiftDate) === formatDate(yesterday)) {
        stats.consecutiveDays++
      } else {
        stats.consecutiveDays = 1
      }
    } else {
      stats.consecutiveDays = 1
    }

    stats.lastShiftDate = update.date
  }

  /**
   * Check if nurse is on leave on a specific date
   */
  private isNurseOnLeave(nurseId: string, dateStr: string): boolean {
    return this.leaves.some((leave) => {
      const normalized = leave as ApiLeave & {
        nurseId?: string
        nurse_id?: string
        startDate?: string
        start_date?: string
        endDate?: string
        end_date?: string
      }

      const leaveNurseId = normalized.nurseId ?? normalized.nurse_id
      if (leaveNurseId !== nurseId) {
        return false
      }

      if ((normalized.type ?? 'annual') === 'preference') {
        return false // Preferences don't block schedule
      }

      const startDate = normalized.startDate ?? normalized.start_date
      const endDate = normalized.endDate ?? normalized.end_date

      if (!startDate || !endDate) {
        return false
      }

      return dateStr >= startDate && dateStr <= endDate
    })
  }

  /**
   * Check if nurse is already assigned on a date
   */
  private isNurseAssignedOnDate(nurseId: string, dateStr: string): boolean {
    const stats = this.nurseStats.get(nurseId)!
    if (!stats.lastShiftDate) return false

    return formatDate(stats.lastShiftDate) === dateStr
  }

  /**
   * Phase 4: Calculate final fairness score
   */
  private calculateFinalFairnessScore() {
    const staffStats = Array.from(this.nurseStats.values())

    const hours = staffStats.map((s) => s.totalHours)
    const nights = staffStats.map((s) => s.nightShiftCount)
    const weekends = staffStats.map((s) => s.weekendShiftCount)

    const hoursStdDev = standardDeviation(hours)
    const nightsStdDev = standardDeviation(nights)
    const weekendsStdDev = standardDeviation(weekends)

    const scores = calculateFairnessScore({
      hoursStdDev,
      nightsStdDev,
      weekendsStdDev
    })

    console.log('[SCHEDULER] Fairness metrics:')
    console.log(`  Hours std dev: ${hoursStdDev.toFixed(2)}`)
    console.log(`  Nights std dev: ${nightsStdDev.toFixed(2)}`)
    console.log(`  Weekends std dev: ${weekendsStdDev.toFixed(2)}`)
    console.log(`  Overall score: ${scores.overall.toFixed(2)}`)

    return scores
  }

  /**
   * Get warnings
   */
  private getWarnings(): string[] {
    const warnings: string[] = []

    // Check if responsible nurse has too many absences
    if (this.responsibleNurse) {
      const responsibleLeaves = this.leaves.filter(
        (l) => l.nurse_id === this.responsibleNurse!.id && l.type !== 'preference'
      )

      if (responsibleLeaves.length > 10) {
        warnings.push(
          `Sorumlu hemşire ${responsibleLeaves.length} gün izinde - bazı gündüz vardiyaları eksik olabilir`
        )
      }
    }

    // Check if any staff has too few hours
    const staffStats = Array.from(this.nurseStats.values())
    const avgHours = mean(staffStats.map((s) => s.totalHours))

    for (const stats of staffStats) {
      if (stats.totalHours < avgHours * 0.7) {
        warnings.push(
          `${stats.nurse.name}: Diğerlerine göre çok az shift (${stats.totalHours} saat)`
        )
      }
    }

    return warnings
  }
}
