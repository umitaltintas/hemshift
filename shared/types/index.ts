export interface Nurse {
  id: string;
  name: string;
  role: 'responsible' | 'staff';
  createdAt: string;
  updatedAt: string;
}



export interface Leave {

  id: string;

  nurseId: string;

  nurseName: string;

  type: 'annual' | 'excuse' | 'sick' | 'preference';

  startDate: string;

  endDate: string;

  notes: string;

  createdAt: string;

}



export interface ShiftAssignment {

  id: string;

  nurseId: string;

  nurseName: string;

  nurseRole: 'responsible' | 'staff';

  assignmentRole: 'responsible' | 'staff';

  assignedBy: 'algorithm' | 'manual';

}



export interface Shift {

  id: string;

  type: 'day_8h' | 'night_16h' | 'weekend_24h';

  startTime: string;

  endTime: string;

  requiredStaff: number;

  requiresResponsible: boolean;

  assignments: ShiftAssignment[];

}



export interface Day {

  date: string;

  isWeekend: boolean;

  isHoliday: boolean;

  shifts: Shift[];

}







export interface Schedule {



  id: string;



  month: string;



  status: 'draft' | 'published';



  fairnessScore: number;



  days: Day[];



}







export interface MonthlyStats {



  scheduleId: string;



  month: string;



  fairnessScore: {



    overall: number;



    hoursScore: number;



    nightsScore: number;



    weekendsScore: number;



    hoursStdDev: number;



    nightsStdDev: number;



    weekendsStdDev: number;



  };



  nurses: {



    nurseId: string;



    nurseName: string;



    nurseRole: 'responsible' | 'staff';



    totalHours: number;



    nightShiftCount: number;



    weekendShiftCount: number;



    totalShiftCount: number;



    dayShiftCount: number;



  }[];



  averages: {



    staffAvgHours: number;



    staffAvgNights: number;



    staffAvgWeekends: number;



  };



}




