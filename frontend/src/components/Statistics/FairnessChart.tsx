import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { MonthlyStats } from '../../types/entities';

interface FairnessChartProps {
  stats: MonthlyStats;
}

const FairnessChart: React.FC<FairnessChartProps> = ({ stats }) => {
  const data = useMemo(
    () =>
      stats.nurses.map((nurse) => ({
        name: nurse.nurseName,
        totalHours: nurse.totalHours,
        nightShift: nurse.nightShiftCount,
        weekendShift: nurse.weekendShiftCount
      })),
    [stats.nurses]
  );

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">Vardiya Dağılım Grafiği</h3>
      <p className="text-xs text-gray-500">Personel bazında toplam saat, gece ve haftasonu nöbetleri</p>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<StatsTooltip stats={stats} />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={stats.averages.staffAvgHours} stroke="#6366f1" strokeDasharray="4 4" label={{ value: 'Saat Ort', position: 'insideTopRight', fontSize: 10, fill: '#6366f1' }} />
            <Bar dataKey="totalHours" name="Toplam Saat" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="nightShift" name="Gece Nöbeti" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="weekendShift" name="Haftasonu" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

const StatsTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string; stats: MonthlyStats }> = ({
  active,
  payload,
  label,
  stats
}) => {
  if (!active || !payload || payload.length === 0 || !label) {
    return null;
  }

  const nurse = stats.nurses.find((item) => item.nurseName === label);
  if (!nurse) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="mt-1 text-gray-600">Toplam Saat: {nurse.totalHours}</p>
      <p className="text-gray-600">Gece Nöbeti: {nurse.nightShiftCount}</p>
      <p className="text-gray-600">Haftasonu: {nurse.weekendShiftCount}</p>
      {nurse.nurseRole === 'staff' && (
        <div className="mt-2 border-t border-dashed border-gray-200 pt-2 text-[11px] text-gray-500">
          <p>Ortalamaya göre saat Δ: {formatDelta(nurse.totalHours - stats.averages.staffAvgHours)}</p>
          <p>Ortalamaya göre gece Δ: {formatDelta(nurse.nightShiftCount - stats.averages.staffAvgNights)}</p>
          <p>Ortalamaya göre haftasonu Δ: {formatDelta(nurse.weekendShiftCount - stats.averages.staffAvgWeekends)}</p>
        </div>
      )}
    </div>
  );
};

const formatDelta = (delta: number) => {
  if (Number.isNaN(delta) || delta === 0) return '0';
  const rounded = Math.round(delta * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}`;
};

export default FairnessChart;
