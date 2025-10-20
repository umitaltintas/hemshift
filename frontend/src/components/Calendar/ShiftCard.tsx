import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Shift, ShiftAssignment } from '../../types/entities';

interface ShiftCardProps {
  shift: Shift;
  onRemove: (assignmentId: string) => void;
}

const SHIFT_LABELS: Record<Shift['type'], string> = {
  day_8h: 'Gündüz (08:00-16:00)',
  night_16h: 'Gece (16:00-08:00)',
  weekend_24h: 'Haftasonu (24 Saat)'
};

const SHIFT_BG: Record<Shift['type'], string> = {
  day_8h: 'border-indigo-100',
  night_16h: 'border-slate-200',
  weekend_24h: 'border-amber-200'
};

const statusClass = (shift: Shift) => {
  if (shift.isComplete) {
    return 'bg-emerald-100 text-emerald-700';
  }
  return 'bg-amber-100 text-amber-700';
};

const statusLabel = (shift: Shift) => {
  if (shift.isComplete) {
    return 'Tamam';
  }
  return shift.statusMessage ?? 'Eksik';
};

const renderAssignment = (
  assignment: ShiftAssignment,
  onRemove: (assignmentId: string) => void
) => (
  <button
    key={assignment.id}
    type="button"
    onClick={() => onRemove(assignment.id)}
    className="group inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100"
    title="Atamayı kaldır"
  >
    <span>{assignment.nurseName}</span>
    <span className="text-xs uppercase tracking-wide text-indigo-400 group-hover:text-indigo-600">
      {assignment.assignedBy === 'manual' ? 'Manuel' : 'Oto'}
    </span>
    <span className="text-indigo-400 group-hover:text-indigo-600">&times;</span>
  </button>
);

const formatTimeRange = (shift: Shift) => {
  const formatTime = (time: string) => time.slice(0, 5);
  return `${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`;
};

const ShiftCard: React.FC<ShiftCardProps> = ({ shift, onRemove }) => {
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

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border bg-white p-4 shadow-sm transition ${
        SHIFT_BG[shift.type]
      } ${isOver ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{SHIFT_LABELS[shift.type]}</p>
          <p className="text-xs text-gray-500">{formatTimeRange(shift)}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(shift)}`}>
          {statusLabel(shift)}
        </span>
      </div>

      <div className="mt-3 space-y-3 text-sm">
        <div>
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500">
            <span>Sorumlu</span>
            <span>
              {responsibleCount}/{shift.requiresResponsible ? 1 : 0}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {responsibleAssignments.length > 0 ? (
              responsibleAssignments.map((assignment) => renderAssignment(assignment, onRemove))
            ) : (
              <Placeholder text={shift.requiresResponsible ? 'Sorumlu hemşire ekleyin' : 'Gerekli değil'} />
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500">
            <span>Staf</span>
            <span>
              {staffCount}/{shift.requiredStaff}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {staffAssignments.length > 0 ? (
              staffAssignments.map((assignment) => renderAssignment(assignment, onRemove))
            ) : (
              <Placeholder text="Staf hemşire ekleyin" />
            )}
          </div>
        </div>
      </div>

      {!shift.isComplete && shift.statusMessage && (
        <p className="mt-3 rounded-md bg-amber-50 px-2 py-2 text-xs text-amber-700">
          {shift.statusMessage}
        </p>
      )}
    </div>
  );
};

const Placeholder: React.FC<{ text: string }> = ({ text }) => (
  <span className="inline-flex rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-400">
    {text}
  </span>
);

export default ShiftCard;
