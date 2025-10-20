import React from 'react';

interface DashboardHeaderProps {
  month: string;
  monthLabel: string;
  schedule: any;
  onMonthChange: (month: string) => void;
  onGenerate: () => void;
  onPublish: () => void;
  onValidate: () => void;
  onExport: (format: 'excel' | 'csv') => void;
  isGenerating: boolean;
  isPublishing: boolean;
  isValidating: boolean;
  isExporting: 'excel' | 'csv' | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  month,
  monthLabel,
  schedule,
  onMonthChange,
  onGenerate,
  onPublish,
  onValidate,
  onExport,
  isGenerating,
  isPublishing,
  isValidating,
  isExporting
}) => {
  return (
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
          onChange={(event) => onMonthChange(event.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || !month || Boolean(schedule)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isGenerating ? 'Oluşturuluyor...' : 'Plan Oluştur'}
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={!schedule || schedule.status !== 'draft' || isPublishing}
          className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
        >
          {isPublishing ? 'Yayınlanıyor...' : 'Planı Yayınla'}
        </button>
        <button
          type="button"
          onClick={onValidate}
          disabled={!schedule || isValidating}
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
        >
          {isValidating ? 'Doğrulanıyor...' : 'Planı Doğrula'}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onExport('excel')}
            disabled={!schedule || isExporting !== null}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            {isExporting === 'excel' ? 'Excel hazırlanıyor...' : 'Excel'}
          </button>
          <button
            type="button"
            onClick={() => onExport('csv')}
            disabled={!schedule || isExporting !== null}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            {isExporting === 'csv' ? 'CSV hazırlanıyor...' : 'CSV'}
          </button>
        </div>
      </div>
    </header>
  );
};
