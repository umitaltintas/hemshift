import React, { useState } from 'react';
import { StatsTable, FairnessChart } from '../components/Statistics';
import { useSchedules } from '../hooks/useSchedules';

const Statistics: React.FC = () => {
  const { schedules, isLoading, isError } = useSchedules();
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

  if (isLoading) return <div>Yükleniyor...</div>;
  if (isError) return <div>Hata oluştu.</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold">İstatistikler</h2>
      <select
        onChange={(e) => setSelectedScheduleId(e.target.value)}
        className="p-2 border rounded mt-4"
      >
        <option value="">Plan Seçin</option>
        {schedules?.map(schedule => (
          <option key={schedule.id} value={schedule.id}>{schedule.month}</option>
        ))}
      </select>

      {selectedScheduleId && (
        <>
          <StatsTable scheduleId={selectedScheduleId} />
          <FairnessChart scheduleId={selectedScheduleId} />
        </>
      )}
    </div>
  );
};

export default Statistics;