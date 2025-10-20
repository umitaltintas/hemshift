
import React from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useSchedule } from '../../hooks/useSchedule';
import { useNurses } from '../../hooks/useNurses';
import DraggableNurse from './DraggableNurse';
import ShiftCell from './ShiftCell';
import { Day, Shift, ShiftAssignment } from '../../../../shared/types';

interface CalendarGridProps {
  month: string;
}

import Error from '../ui/Error';



const CalendarGrid: React.FC<CalendarGridProps> = ({ month }) => {
  const { schedule, isLoading, isError, refetch } = useSchedule(month);
  const { nurses } = useNurses();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Implement logic to update the schedule with the new assignment
      // This is a placeholder for actual implementation
      console.log(`Nurse ${active.id} assigned to shift ${over.id}`);
      // After updating the schedule, refetch the data
      refetch();
    }
  };
  if (isLoading) return <div>Yükleniyor...</div>;
  if (isError) return <Error message="Takvim yüklenirken bir hata oluştu." />;

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-8 gap-1">
        {/* Header */}
        <div className="font-bold">Tarih</div>
        <div className="font-bold">Gündüz (08:00-16:00)</div>
        <div className="font-bold">Gece (16:00-08:00)</div>
        <div className="font-bold">Haftasonu (24h)</div>
        <div className="font-bold col-span-4">Hemşireler</div>

        {schedule?.days.map((day: Day) => (
          <React.Fragment key={day.date}>
            <div className="p-2 border">{day.date}</div>
            {day.shifts.map((shift: Shift) => (
              <ShiftCell key={shift.id} shiftId={shift.id}>
                {shift.assignments.map((assignment: ShiftAssignment) => (
                  <div key={assignment.id}>{assignment.nurseName}</div>
                ))}
              </ShiftCell>
            ))}
            {/* Empty cells for shifts that don't exist on a particular day */}
            {Array(3 - day.shifts.length).fill(0).map((_, i) => <div key={i} className="p-2 border bg-gray-100"></div>)}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-4">
        <h3 className="text-xl font-bold">Hemşireler</h3>
        <div className="flex flex-wrap gap-2">
          {nurses?.map(nurse => (
            <DraggableNurse key={nurse.id} nurse={nurse} />
          ))}
        </div>
      </div>
    </DndContext>
  );
};

export default CalendarGrid;
