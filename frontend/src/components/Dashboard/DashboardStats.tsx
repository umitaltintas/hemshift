import React from 'react';
import type { Schedule } from '../../types/entities';

interface DashboardStatsProps {
  schedule: Schedule | null;
  monthLabel: string;
  statusBadge: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  schedule,
  monthLabel,
  statusBadge
}) => {
  const totalShifts = schedule
    ? schedule.stats.completeShifts + schedule.stats.incompleteShifts
    : 0;
  const completionRate =
    totalShifts > 0 ? Math.round((schedule!.stats.completeShifts / totalShifts) * 100) : 0;

  return (
    <section className="grid gap-4 md:grid-cols-3">
      {/* Plan Status Card */}
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

      {/* Fairness Score Card */}
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

      {/* Completion Rate Card */}
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
  );
};
