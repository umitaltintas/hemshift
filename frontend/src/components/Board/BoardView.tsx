import React, { useMemo, useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Nurse, Schedule, Shift } from '../../types/entities';
import BoardColumn from './BoardColumn';
import DraggableNurse from '../Calendar/DraggableNurse';
import Error from '../ui/Error';
import { getErrorMessage } from '../../utils/errors';

interface BoardViewProps {
  schedule: Schedule | null | undefined;
  nurses?: Nurse[];
  isLoading: boolean;
  isError: boolean;
  nursesLoading?: boolean;
  onAssign: (shiftId: string, nurseId: string) => Promise<void>;
  onRemove: (assignmentId: string) => Promise<void>;
}

type FeedbackState = { type: 'success' | 'error'; text: string } | null;

const SHIFT_LABELS: Record<Shift['type'], string> = {
  day_8h: 'Gündüz Vardiyası',
  night_16h: 'Gece Vardiyası',
  weekend_24h: 'Haftasonu Vardiyası'
};

const SHIFT_COLORS: Record<Shift['type'], string> = {
  day_8h: 'bg-indigo-50 border-indigo-200',
  night_16h: 'bg-slate-50 border-slate-200',
  weekend_24h: 'bg-amber-50 border-amber-200'
};

const canAssign = (nurse: Nurse, shift: Shift): { allowed: boolean; reason?: string } => {
  const responsibleCount = shift.currentResponsible ?? shift.assignments.filter((a) => a.assignmentRole === 'responsible').length;
  const staffCount = shift.currentStaff ?? shift.assignments.filter((a) => a.assignmentRole === 'staff').length;

  if (shift.assignments.some((assignment) => assignment.nurseId === nurse.id)) {
    return { allowed: false, reason: 'Hemşire bu vardiyaya zaten atanmış' };
  }

  if (nurse.role === 'responsible') {
    if (shift.type !== 'day_8h') {
      return {
        allowed: false,
        reason: 'Sorumlu hemşire sadece gündüz vardiyasında çalışabilir'
      };
    }
    if (responsibleCount >= 1) {
      return {
        allowed: false,
        reason: 'Bu vardiyada zaten sorumlu hemşire var'
      };
    }
  } else {
    if (staffCount >= shift.requiredStaff) {
      return {
        allowed: false,
        reason: 'Bu vardiya için gerekli staf sayısına ulaşıldı'
      };
    }
  }

  return { allowed: true };
};

const BoardView: React.FC<BoardViewProps> = ({
  schedule,
  nurses,
  isLoading,
  isError,
  nursesLoading,
  onAssign,
  onRemove
}) => {
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const responsibleNurses = useMemo(
    () => (nurses ?? []).filter((nurse) => nurse.role === 'responsible'),
    [nurses]
  );
  const staffNurses = useMemo(
    () => (nurses ?? []).filter((nurse) => nurse.role === 'staff'),
    [nurses]
  );

  // Group shifts by type across all days
  const shiftsByType = useMemo(() => {
    if (!schedule) return { day_8h: [], night_16h: [], weekend_24h: [] };

    const grouped: Record<Shift['type'], Shift[]> = {
      day_8h: [],
      night_16h: [],
      weekend_24h: []
    };

    schedule.days.forEach((day) => {
      day.shifts.forEach((shift) => {
        grouped[shift.type].push(shift);
      });
    });

    return grouped;
  }, [schedule]);

  const handleAssign = async (shift: Shift, nurse: Nurse) => {
    const validation = canAssign(nurse, shift);
    if (!validation.allowed) {
      setFeedback({ type: 'error', text: validation.reason ?? 'Atama gerçekleştirilemedi' });
      return;
    }
    try {
      await onAssign(shift.id, nurse.id);
      setFeedback({
        type: 'success',
        text: `${nurse.name}, ${shift.date} ${SHIFT_LABELS[shift.type]}na atandı`
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Atama sırasında bir hata oluştu');
      setFeedback({
        type: 'error',
        text: message
      });
    }
  };

  const handleRemove = (assignmentId: string) => {
    onRemove(assignmentId)
      .then(() => {
        setFeedback({
          type: 'success',
          text: 'Atama kaldırıldı'
        });
      })
      .catch((error: unknown) => {
        const message = getErrorMessage(error, 'Atama kaldırılırken hata oluştu');
        setFeedback({
          type: 'error',
          text: message
        });
      });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const nurse = active.data.current?.nurse as Nurse | undefined;
    const shift = over.data.current?.shift as Shift | undefined;
    if (!nurse || !shift) return;

    await handleAssign(shift, nurse);
  };

  if (isLoading) {
    return <div className="rounded-lg border border-dashed border-gray-200 p-6 text-gray-500">Takvim yükleniyor...</div>;
  }

  if (isError) {
    return <Error message="Takvim yüklenirken bir hata oluştu." />;
  }

  if (!schedule) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-gray-600">
        Bu ay için henüz bir plan oluşturulmamış. Yukarıdaki &quot;Plan Oluştur&quot; butonunu kullanarak yeni bir plan başlatabilirsiniz.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {/* Nurse Pool Column */}
          <div className="flex-shrink-0 w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-sm h-fit">
            <h4 className="text-sm font-semibold text-gray-900">Hemşire Havuzu</h4>
            {nursesLoading ? (
              <p className="mt-3 text-sm text-gray-500">Hemşire listesi yükleniyor...</p>
            ) : (
              <div className="mt-4 space-y-4">
                {responsibleNurses.length > 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Sorumlu</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {responsibleNurses.map((nurse) => (
                        <DraggableNurse key={nurse.id} nurse={nurse} />
                      ))}
                    </div>
                  </div>
                )}
                {staffNurses.length > 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Staf</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {staffNurses.map((nurse) => (
                        <DraggableNurse key={nurse.id} nurse={nurse} />
                      ))}
                    </div>
                  </div>
                )}
                {staffNurses.length === 0 && responsibleNurses.length === 0 && (
                  <span className="text-sm text-gray-500">Hemşire bulunamadı.</span>
                )}
              </div>
            )}
            <p className="mt-4 text-xs text-gray-400">
              Bir hemşireyi sağdaki vardiya kartlarına sürükleyip bırakarak atama yapabilirsiniz.
            </p>
          </div>

          {/* Shift Type Columns */}
          {(['day_8h', 'night_16h', 'weekend_24h'] as const).map((shiftType) => (
            <BoardColumn
              key={shiftType}
              title={SHIFT_LABELS[shiftType]}
              shiftType={shiftType}
              shifts={shiftsByType[shiftType]}
              onRemove={handleRemove}
              colorClass={SHIFT_COLORS[shiftType]}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default BoardView;
