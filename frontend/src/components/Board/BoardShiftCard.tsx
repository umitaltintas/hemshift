import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Shift, ShiftAssignment } from '../../types/entities';

interface BoardShiftCardProps {
  shift: Shift;
  onRemove: (assignmentId: string) => void;
  shiftType: Shift['type'];
}


const formatDay = (date: string) => {
  try {
    return format(new Date(date), 'dd MMM', { locale: tr });
  } catch (error) {
    return date;
  }
};

const formatTimeRange = (shift: Shift) => {
  const formatTime = (time: string) => time.slice(0, 5);
  return `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`;
};

const renderAssignment = (
  assignment: ShiftAssignment,
  onRemove: (assignmentId: string) => void
) => (
  <button
    key={assignment.id}
    type="button"
    onClick={() => onRemove(assignment.id)}
    className="w-full group text-left inline-flex items-center justify-between gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-indigo-700 border border-indigo-200 transition hover:bg-indigo-50 hover:border-indigo-300"
    title="Atamayı kaldır"
  >
    <span className="truncate flex-1">{assignment.nurseName}</span>
    <span className="text-indigo-400 group-hover:text-indigo-600 flex-shrink-0">&times;</span>
  </button>
);

const BoardShiftCard: React.FC<BoardShiftCardProps> = ({ shift, onRemove }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: shift.id,
    data: { type: 'shift', shift }
  });

  const responsibleAssignments = shift.assignments.filter(
    (assignment) => assignment.assignmentRole === 'responsible'
  );
  const staffAssignments = shift.assignments.filter(
    (assignment) => assignment.assignmentRole === 'staff'
  );

  const staffCount = shift.currentStaff ?? staffAssignments.length;
  const responsibleCount = shift.currentResponsible ?? responsibleAssignments.length;

  const statusClass = shift.isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
  const statusLabel = shift.isComplete ? 'Tamam' : 'Eksik';

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 bg-white p-3 transition ${
        isOver ? 'ring-2 ring-indigo-400 ring-offset-2 border-indigo-300' : 'border-gray-200'
      }`}
    >
      {/* Header with date and status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900">{formatDay(shift.date)}</p>
          <p className="text-xs text-gray-500">{formatTimeRange(shift)}</p>
        </div>
        <span className={`flex-shrink-0 rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      {/* Responsible section */}
      {shift.requiresResponsible && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-1">
            <span>Sorumlu</span>
            <span className="text-gray-500">
              {responsibleCount}/1
            </span>
          </div>
          <div className="space-y-1">
            {responsibleAssignments.length > 0 ? (
              responsibleAssignments.map((assignment) => renderAssignment(assignment, onRemove))
            ) : (
              <div className="text-xs text-gray-400 border border-dashed border-gray-300 rounded px-2 py-1">
                Ekle
              </div>
            )}
          </div>
        </div>
      )}

      {/* Staff section */}
      <div>
        <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-1">
          <span>Staf</span>
          <span className="text-gray-500">
            {staffCount}/{shift.requiredStaff}
          </span>
        </div>
        <div className="space-y-1">
          {staffAssignments.length > 0 ? (
            staffAssignments.map((assignment) => renderAssignment(assignment, onRemove))
          ) : (
            <div className="text-xs text-gray-400 border border-dashed border-gray-300 rounded px-2 py-1">
              Ekle
            </div>
          )}
        </div>
      </div>

      {/* Status message if incomplete */}
      {!shift.isComplete && shift.statusMessage && (
        <p className="mt-2 rounded text-xs text-amber-700 bg-amber-50 px-2 py-1 border border-amber-200">
          {shift.statusMessage}
        </p>
      )}
    </div>
  );
};

export default BoardShiftCard;
