import React, { useMemo, useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ShiftCard from './ShiftCard';
import DraggableNurse from './DraggableNurse';
import { Nurse, Schedule, Shift } from '../../types/entities';
import Error from '../ui/Error';
import { getErrorMessage } from '../../utils/errors';

interface CalendarGridProps {
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
  day_8h: 'Gündüz vardiyası',
  night_16h: 'Gece vardiyası',
  weekend_24h: 'Haftasonu vardiyası'
};

const formatDay = (date: string) => {
  try {
    return format(new Date(date), 'dd MMMM EEEE', { locale: tr });
  } catch (error) {
    return date;
  }
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

const CalendarGrid: React.FC<CalendarGridProps> = ({
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
        text: `${nurse.name}, ${formatDay(shift.date)} ${SHIFT_LABELS[shift.type]}na atandı`
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
        <div className="flex flex-col gap-5">
          {schedule.days.map((day) => (
            <div
              key={day.date}
              className={`rounded-xl border bg-white p-4 shadow-sm ${
                day.isWeekend ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-gray-200 pb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{formatDay(day.date)}</h3>
                  <p className="text-xs text-gray-500">
                    {day.isWeekend ? 'Haftasonu' : 'Hafta içi'}
                    {day.isHoliday && ' · Resmi tatil'}
                  </p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                  {day.shifts.length} vardiya
                </span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {day.shifts.map((shift) => (
                  <ShiftCard key={shift.id} shift={shift} onRemove={handleRemove} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-900">Hemşire Havuzu</h4>
          {nursesLoading ? (
            <p className="mt-3 text-sm text-gray-500">Hemşire listesi yükleniyor...</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
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
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Staf</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {staffNurses.map((nurse) => (
                    <DraggableNurse key={nurse.id} nurse={nurse} />
                  ))}
                  {staffNurses.length === 0 && (
                    <span className="text-sm text-gray-500">Tanımlı staf hemşire bulunamadı.</span>
                  )}
                </div>
              </div>
            </div>
          )}
          <p className="mt-4 text-xs text-gray-400">
            Bir hemşireyi ilgili vardiya kartına sürükleyip bırakarak atama yapabilirsiniz. Kart üzerindeki atamalara tıklayarak kaldırabilirsiniz.
          </p>
        </section>
      </DndContext>
    </div>
  );
};

export default CalendarGrid;
