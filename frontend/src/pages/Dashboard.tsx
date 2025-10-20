import React, { useMemo, useState } from 'react';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarGrid } from '../components/Calendar';
import { useSchedule } from '../hooks/useSchedule';
import { useNurses } from '../hooks/useNurses';
import { ValidationResult } from '../types/entities';

const statusStyles: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-700 border-amber-200',
  published: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  archived: 'bg-gray-100 text-gray-600 border-gray-200'
};

const Dashboard: React.FC = () => {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isExporting, setIsExporting] = useState<'excel' | 'csv' | null>(null);

  const {
    schedule,
    isLoading,
    isError,
    generateScheduleAsync,
    publishScheduleAsync,
    validateSchedule,
    exportSchedule,
    updateAssignmentAsync,
    removeAssignmentAsync
  } = useSchedule(month);
  const { nurses, isLoading: nursesLoading } = useNurses();

  const monthLabel = useMemo(() => {
    try {
      const parsed = parse(`${month}-01`, 'yyyy-MM-dd', new Date());
      return format(parsed, 'MMMM yyyy', { locale: tr });
    } catch (error) {
      return month;
    }
  }, [month]);

  const totalShifts = schedule
    ? schedule.stats.completeShifts + schedule.stats.incompleteShifts
    : 0;
  const completionRate =
    totalShifts > 0 ? Math.round((schedule!.stats.completeShifts / totalShifts) * 100) : 0;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setActionMessage(null);
    setValidationResult(null);
    try {
      await generateScheduleAsync(month);
      setActionMessage({
        type: 'success',
        text: `${monthLabel} planı başarıyla oluşturuldu`
      });
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Plan oluşturulamadı'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!schedule || schedule.status !== 'draft') return;
    setIsPublishing(true);
    setActionMessage(null);
    try {
      await publishScheduleAsync(schedule.id);
      setActionMessage({
        type: 'success',
        text: `${monthLabel} planı yayınlandı`
      });
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Plan yayınlanamadı'
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleValidate = async () => {
    if (!schedule) return;
    setIsValidating(true);
    setActionMessage(null);
    try {
      const result = await validateSchedule(schedule.id);
      setValidationResult(result);
      setActionMessage({
        type: result.isValid ? 'success' : 'error',
        text: result.isValid
          ? 'Plan tüm zorunlu kuralları sağlıyor'
          : 'Plan doğrulama sonucu hatalar içeriyor'
      });
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Doğrulama sırasında hata oluştu'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleExport = async (format: 'excel' | 'csv') => {
    if (!schedule) return;
    setIsExporting(format);
    setActionMessage(null);
    try {
      // Use mutateAsync from the mutation hook which handles the { scheduleId, format } parameter
      const blob = await exportSchedule({
        scheduleId: schedule.id,
        format
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const slug = month.replace('-', '');
      link.download = format === 'excel' ? `shift-plan-${slug}.xlsx` : `shift-plan-${slug}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setActionMessage({
        type: 'success',
        text: format === 'excel' ? 'Excel export hazırlandı' : 'CSV export hazırlandı'
      });
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Export sırasında hata oluştu'
      });
    } finally {
      setIsExporting(null);
    }
  };

  const statusBadge = schedule
    ? statusStyles[schedule.status] ?? statusStyles.draft
    : 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Aylık Planlama</h2>
          <p className="text-sm text-gray-500">
            {monthLabel} dönemine ait vardiya planı ve atamalar
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !month || Boolean(schedule)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isGenerating ? 'Oluşturuluyor...' : 'Plan Oluştur'}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!schedule || schedule.status !== 'draft' || isPublishing}
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
          >
            {isPublishing ? 'Yayınlanıyor...' : 'Planı Yayınla'}
          </button>
          <button
            type="button"
            onClick={handleValidate}
            disabled={!schedule || isValidating}
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
          >
            {isValidating ? 'Doğrulanıyor...' : 'Planı Doğrula'}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport('excel')}
              disabled={!schedule || isExporting !== null}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              {isExporting === 'excel' ? 'Excel hazırlanıyor...' : 'Excel'}
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              disabled={!schedule || isExporting !== null}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              {isExporting === 'csv' ? 'CSV hazırlanıyor...' : 'CSV'}
            </button>
          </div>
        </div>
      </header>

      {actionMessage && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            actionMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <div className={`rounded-xl border ${statusBadge} bg-white/80 p-4 shadow-sm`}>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Plan Durumu
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {schedule ? (schedule.status === 'draft' ? 'Taslak' : 'Yayınlandı') : 'Henüz oluşturulmadı'}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {schedule ? `${monthLabel} planı ${schedule.status === 'draft' ? 'taslak halinde' : 'yayında'}.` : 'Plan oluşturmadan önce hemşire ve izin bilgilerini tamamlayın.'}
          </p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Adalet Skoru
            </p>
            <span className="text-sm font-semibold text-indigo-600">
              {schedule?.fairnessScore ? `${schedule.fairnessScore.toFixed(1)}/100` : '—'}
            </span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-indigo-100">
            <div
              className="h-2 rounded-full bg-indigo-500 transition-all"
              style={{ width: `${Math.min(schedule?.fairnessScore ?? 0, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {schedule?.fairnessScore
              ? 'Gece nöbeti, haftasonu ve toplam çalışma saatleri dengeli.'
              : 'Plan oluşturulduğunda adalet skoru otomatik hesaplanır.'}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Tamamlanma
            </p>
            <span className="text-sm font-semibold text-emerald-600">
              {schedule ? `${schedule.stats.completeShifts}/${totalShifts}` : '0/0'}
            </span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-emerald-100">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {schedule
              ? `${schedule.stats.incompleteShifts} vardiya daha atama bekliyor.`
              : 'Plan oluşturduktan sonra vardiya atamalarını buradan takip edin.'}
          </p>
        </div>
      </section>

      {schedule && schedule.warnings && schedule.warnings.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-amber-800">Uyarılar</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
            {schedule.warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-amber-700">
            Uyarılar algoritmanın önerdiği potansiyel iyileştirmelerdir. Manuel atamalarla güncelleyebilirsiniz.
          </p>
        </section>
      )}

      {validationResult && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Doğrulama Sonucu</h3>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                validationResult.isValid
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {validationResult.isValid ? 'Geçerli' : 'Hatalar Var'}
            </span>
          </div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Hatalar
              </h4>
              {validationResult.errors.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-700">
                  {validationResult.errors.map((error, index) => (
                    <li key={`${error}-${index}`}>{error}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-500">Hata bulunamadı.</p>
              )}
            </div>
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Uyarılar
              </h4>
              {validationResult.warnings.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={`${warning}-${index}`}>{warning}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-500">Uyarı bulunamadı.</p>
              )}
            </div>
          </div>
        </section>
      )}

      <CalendarGrid
        schedule={schedule}
        nurses={nurses}
        isLoading={isLoading}
        isError={isError}
        nursesLoading={nursesLoading}
        onAssign={(shiftId, nurseId) => updateAssignmentAsync({ shiftId, nurseId })}
        onRemove={(assignmentId) => removeAssignmentAsync(assignmentId)}
      />
    </div>
  );
};

export default Dashboard;
