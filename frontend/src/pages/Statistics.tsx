import React, { useEffect, useMemo, useState } from 'react';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useSchedules } from '../hooks/useSchedules';
import { useStats } from '../hooks/useStats';
import { FairnessChart, StatsTable } from '../components/Statistics';
import FairnessSummary from '../components/Statistics/FairnessSummary';
import { exportSchedule } from '../services/scheduleService';
import { getErrorMessage } from '../utils/errors';

const Statistics: React.FC = () => {
  const { schedules, isLoading, isError } = useSchedules();
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'excel' | 'csv' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (!selectedScheduleId && schedules && schedules.length > 0) {
      setSelectedScheduleId(schedules[0].id);
    }
  }, [schedules, selectedScheduleId]);

  const {
    stats,
    isLoading: statsLoading,
    isError: statsError
  } = useStats(selectedScheduleId ?? '');

  const selectedSchedule = useMemo(
    () => schedules?.find((item) => item.id === selectedScheduleId) ?? null,
    [schedules, selectedScheduleId]
  );

  const monthLabel = useMemo(() => {
    if (!selectedSchedule) return '';
    try {
      const parsed = parse(`${selectedSchedule.month}-01`, 'yyyy-MM-dd', new Date());
      return format(parsed, 'MMMM yyyy', { locale: tr });
    } catch (error) {
      return selectedSchedule.month;
    }
  }, [selectedSchedule]);

  const handleExport = async (formatType: 'excel' | 'csv') => {
    if (!selectedScheduleId) return;
    setExporting(formatType);
    setFeedback(null);
    try {
      const blob = await exportSchedule(selectedScheduleId, formatType);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const slug = selectedSchedule?.month.replace('-', '') ?? selectedScheduleId;
      link.download = formatType === 'excel' ? `shift-plan-${slug}.xlsx` : `shift-plan-${slug}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setFeedback({
        type: 'success',
        text: formatType === 'excel' ? 'Excel export hazırlandı' : 'CSV export hazırlandı'
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: getErrorMessage(error, 'Export işlemi başarısız oldu')
      });
    } finally {
      setExporting(null);
    }
  };

  if (isLoading) {
    return <div className="rounded-lg border border-dashed border-gray-200 p-4 text-gray-500">Plan listesi yükleniyor...</div>;
  }

  if (isError) {
    return <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Plan listesi yüklenirken bir hata oluştu.</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">İstatistikler</h2>
          <p className="text-sm text-gray-500">
            Planlanan aylar için adalet skorları ve vardiya dağılımları
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedScheduleId ?? ''}
            onChange={(event) => setSelectedScheduleId(event.target.value || null)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {schedules?.map((schedule) => (
              <option key={schedule.id} value={schedule.id}>
                {schedule.month}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport('excel')}
              disabled={!selectedScheduleId || exporting !== null}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              {exporting === 'excel' ? 'Excel hazırlanıyor...' : 'Excel'}
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              disabled={!selectedScheduleId || exporting !== null}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              {exporting === 'csv' ? 'CSV hazırlanıyor...' : 'CSV'}
            </button>
          </div>
        </div>
      </header>

      {feedback && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {statsLoading && (
        <div className="rounded-lg border border-dashed border-gray-200 p-4 text-gray-500">
          İstatistikler yükleniyor...
        </div>
      )}

      {statsError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          İstatistikler yüklenirken bir hata oluştu.
        </div>
      )}

      {stats && selectedSchedule && (
        <>
          <section className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-indigo-600">Seçilen Plan</p>
                <h3 className="text-xl font-semibold text-gray-900">{monthLabel}</h3>
                <p className="text-sm text-gray-500">Durum: {selectedSchedule.status === 'published' ? 'Yayınlandı' : 'Taslak'}</p>
              </div>
              <div className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
                Adalet Skoru: {selectedSchedule.fairnessScore?.toFixed(1) ?? '—'}
              </div>
            </div>
          </section>

          <FairnessSummary fairness={stats.fairnessScore} />
          <StatsTable stats={stats} />
          <FairnessChart stats={stats} />
        </>
      )}
    </div>
  );
};

export default Statistics;
