import React, { useMemo } from 'react';
import { format, parse, addMonths, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';

interface MonthPickerProps {
  month: string;
  onMonthChange: (month: string) => void;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({ month, onMonthChange }) => {
  const parsedDate = useMemo(() => {
    try {
      return parse(`${month}-01`, 'yyyy-MM-dd', new Date());
    } catch {
      return new Date();
    }
  }, [month]);

  const monthLabel = useMemo(() => {
    try {
      return format(parsedDate, 'MMMM yyyy', { locale: tr });
    } catch {
      return month;
    }
  }, [parsedDate, month]);

  const handlePrevMonth = () => {
    const prevDate = subMonths(parsedDate, 1);
    onMonthChange(format(prevDate, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const nextDate = addMonths(parsedDate, 1);
    onMonthChange(format(nextDate, 'yyyy-MM'));
  };

  const handleMonthSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMonthChange(e.target.value);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm">
      <button
        type="button"
        onClick={handlePrevMonth}
        className="rounded px-2 py-1 text-gray-600 transition hover:bg-gray-100"
        title="Önceki ay"
      >
        ←
      </button>

      <div className="relative">
        <input
          type="month"
          value={month}
          onChange={handleMonthSelect}
          className="w-32 rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <span className="text-sm font-medium text-gray-700 min-w-max">{monthLabel}</span>

      <button
        type="button"
        onClick={handleNextMonth}
        className="rounded px-2 py-1 text-gray-600 transition hover:bg-gray-100"
        title="Sonraki ay"
      >
        →
      </button>
    </div>
  );
};
