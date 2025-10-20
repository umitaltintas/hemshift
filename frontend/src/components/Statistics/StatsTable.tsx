import React from 'react';
import { MonthlyStats } from '../../types/entities';

interface StatsTableProps {
  stats: MonthlyStats;
}

const formatDelta = (value: number) => {
  if (Number.isNaN(value) || value === 0) return '0';
  const rounded = Math.round(value);
  return `${rounded > 0 ? '+' : ''}${rounded}`;
};

const StatsTable: React.FC<StatsTableProps> = ({ stats }) => {
  const { staffAvgHours, staffAvgNights, staffAvgWeekends } = stats.averages;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">Hemşire Bazlı Dağılım</h3>
      <div className="overflow-x-auto">
        <table className="mt-3 min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Hemşire</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Rol</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Toplam Saat</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Saat Δ</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Gece Nöbeti</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Gece Δ</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Haftasonu</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Haftasonu Δ</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Toplam Vardiya</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {stats.nurses.map((nurse) => {
              const isStaff = nurse.nurseRole === 'staff';
              const hoursDelta = isStaff ? nurse.totalHours - staffAvgHours : 0;
              const nightsDelta = isStaff ? nurse.nightShiftCount - staffAvgNights : 0;
              const weekendDelta = isStaff ? nurse.weekendShiftCount - staffAvgWeekends : 0;

              return (
                <tr key={nurse.nurseId}>
                  <td className="px-4 py-3 font-medium text-gray-900">{nurse.nurseName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        nurse.nurseRole === 'responsible'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {nurse.nurseRole === 'responsible' ? 'Sorumlu' : 'Staf'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">{nurse.totalHours}</td>
                  <td className={`px-4 py-3 text-right text-xs ${deltaClass(hoursDelta)}`}>
                    {isStaff ? formatDelta(hoursDelta) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">{nurse.nightShiftCount}</td>
                  <td className={`px-4 py-3 text-right text-xs ${deltaClass(nightsDelta)}`}>
                    {isStaff ? formatDelta(nightsDelta) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">{nurse.weekendShiftCount}</td>
                  <td className={`px-4 py-3 text-right text-xs ${deltaClass(weekendDelta)}`}>
                    {isStaff ? formatDelta(weekendDelta) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{nurse.totalShiftCount}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-4 py-3 font-semibold text-gray-700">Personel Ortalaması</td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-right text-gray-700">{Math.round(staffAvgHours)}</td>
              <td className="px-4 py-3 text-right text-xs text-gray-500">Baz</td>
              <td className="px-4 py-3 text-right text-gray-700">{Math.round(staffAvgNights)}</td>
              <td className="px-4 py-3 text-right text-xs text-gray-500">Baz</td>
              <td className="px-4 py-3 text-right text-gray-700">{Math.round(staffAvgWeekends)}</td>
              <td className="px-4 py-3 text-right text-xs text-gray-500">Baz</td>
              <td className="px-4 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-400">
        Δ değerleri staf ortalamasına göre farkı gösterir. Pozitif değerler ortalamanın üzerinde, negatif değerler ortalamanın altında çalışmayı ifade eder.
      </p>
    </section>
  );
};

const deltaClass = (delta: number) => {
  if (delta === 0) return 'text-gray-500';
  if (delta > 0) return 'text-emerald-600';
  return 'text-rose-600';
};

export default StatsTable;
