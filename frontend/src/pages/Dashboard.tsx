import React, { useState } from 'react';
import { CalendarGrid } from '../components/Calendar';
import { format } from 'date-fns';
import { useSchedule } from '../hooks/useSchedule';

const Dashboard: React.FC = () => {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const { generateSchedule } = useSchedule(month);

  return (
    <div>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Takvim</h2>
        <div className="flex items-center gap-4">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="p-2 border rounded"
          />
          <button
            onClick={() => generateSchedule(month)}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Plan Oluştur
          </button>
        </div>
      </div>
      <CalendarGrid month={month} />
    </div>
  );
};

export default Dashboard;