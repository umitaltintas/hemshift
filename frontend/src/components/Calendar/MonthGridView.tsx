import React, { useMemo, useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { format, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { tr } from 'date-fns/locale';
import DraggableNurse from './DraggableNurse';
import { Nurse, Schedule, Shift } from '../../types/entities';
import Error from '../ui/Error';
import { getErrorMessage } from '../../utils/errors';

interface MonthGridViewProps {
  schedule: Schedule | null | undefined;
  nurses?: Nurse[];
  isLoading: boolean;
  isError: boolean;
  nursesLoading?: boolean;
  onAssign: (shiftId: string, nurseId: string) => Promise<void>;
}

type FeedbackState = { type: 'success' | 'error'; text: string } | null;

const SHIFT_LABELS: Record<Shift['type'], string> = {
  day_8h: 'Gündüz vardiyası',
  night_16h: 'Gece vardiyası',
  weekend_24h: 'Haftasonu vardiyası'
};

const WEEKDAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

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

const MonthGridView: React.FC<MonthGridViewProps> = ({
  schedule,
  nurses,
  isLoading,
  isError,
  nursesLoading,
  onAssign
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

  // Build calendar grid for the month
  const calendarDays = useMemo(() => {
    if (!schedule || schedule.days.length === 0) return [];

    const firstDay = schedule.days[0].date;
    const lastDay = schedule.days[schedule.days.length - 1].date;

    const monthStart = startOfWeek(new Date(firstDay), { weekStartsOn: 1 });
    const monthEnd = endOfWeek(new Date(lastDay), { weekStartsOn: 1 });

    const calendarWeeks = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Create a map of date -> DaySchedule for quick lookup
    const dayMap = new Map(schedule.days.map(day => [day.date, day]));

    return calendarWeeks.map(date => ({
      date: format(date, 'yyyy-MM-dd'),
      jsDate: date,
      daySchedule: dayMap.get(format(date, 'yyyy-MM-dd'))
    }));
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
        <div className="space-y-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAY_NAMES.map((day) => (
              <div key={day} className="rounded-lg bg-gray-100 p-3 text-center">
                <p className="text-sm font-semibold text-gray-700">{day}</p>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((calDay) => {
              const isCurrentMonth = calDay.daySchedule !== undefined;
              const isWeekend = calDay.daySchedule?.isWeekend ?? false;
              const isHoliday = calDay.daySchedule?.isHoliday ?? false;

              return (
                <div
                  key={calDay.date}
                  className={`min-h-40 rounded-lg border p-2 ${
                    !isCurrentMonth
                      ? 'bg-gray-50 opacity-30'
                      : isWeekend
                      ? 'border-amber-200 bg-amber-50/40'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`text-sm font-semibold ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}`}>
                      {format(calDay.jsDate, 'd')}
                    </span>
                    {isCurrentMonth && (
                      <div className="flex flex-col items-end gap-0.5">
                        {isWeekend && <span className="text-xs bg-amber-100 px-1.5 py-0.5 rounded text-amber-700 font-medium">Haftasonu</span>}
                        {isHoliday && <span className="text-xs bg-red-100 px-1.5 py-0.5 rounded text-red-700 font-medium">Tatil</span>}
                      </div>
                    )}
                  </div>

                  {isCurrentMonth && calDay.daySchedule && (
                    <div className="space-y-1">
                      {calDay.daySchedule.shifts.length > 0 ? (
                        <div className="space-y-1">
                          {calDay.daySchedule.shifts.map((shift) => (
                            <div
                              key={shift.id}
                              className={`rounded border p-1.5 text-xs cursor-pointer transition hover:shadow-md ${
                                shift.type === 'day_8h'
                                  ? 'border-indigo-200 bg-indigo-50'
                                  : shift.type === 'night_16h'
                                  ? 'border-slate-200 bg-slate-50'
                                  : 'border-amber-200 bg-amber-50'
                              } ${shift.isComplete ? 'ring-1 ring-emerald-300' : ''}`}
                              title={`${shift.type === 'day_8h' ? 'Gündüz' : shift.type === 'night_16h' ? 'Gece' : 'Haftasonu'} - Tıkla veya sürükle`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-medium">
                                  {shift.type === 'day_8h' ? '📅' : shift.type === 'night_16h' ? '🌙' : '⭐'}
                                </span>
                                <span className={`text-xs px-1 rounded ${shift.isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {shift.currentStaff ?? 0}/{shift.requiredStaff}
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                {shift.assignments.length > 0 ? (
                                  shift.assignments.slice(0, 3).map((assignment) => (
                                    <div key={assignment.id} className="truncate text-gray-700 font-medium">
                                      {assignment.nurseName}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-gray-400">Boş</div>
                                )}
                                {shift.assignments.length > 3 && (
                                  <div className="text-gray-500 text-xs">+{shift.assignments.length - 3} daha</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 text-center py-2">Vardiya yok</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

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

export default MonthGridView;
