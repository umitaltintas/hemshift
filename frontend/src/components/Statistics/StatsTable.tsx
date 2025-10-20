
import React from 'react';
import { useStats } from '../../hooks/useStats';

import Error from '../ui/Error';

// ...

const StatsTable: React.FC<{ scheduleId: string }> = ({ scheduleId }) => {
  const { stats, isLoading, isError } = useStats(scheduleId);

  if (isLoading) return <div>Yükleniyor...</div>;
  if (isError) return <Error message="İstatistikler yüklenirken bir hata oluştu." />;

  return (
    <div className="mt-4">
      <h3 className="text-xl font-bold">İstatistikler</h3>
      <table className="min-w-full divide-y divide-gray-200 mt-2">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hemşire</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Saat</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gece Nöbeti</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Haftasonu Nöbeti</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {stats?.nurses.map(nurse => (
            <tr key={nurse.nurseId}>
              <td className="px-6 py-4 whitespace-nowrap">{nurse.nurseName}</td>
              <td className="px-6 py-4 whitespace-nowrap">{nurse.totalHours}</td>
              <td className="px-6 py-4 whitespace-nowrap">{nurse.nightShiftCount}</td>
              <td className="px-6 py-4 whitespace-nowrap">{nurse.weekendShiftCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StatsTable;
