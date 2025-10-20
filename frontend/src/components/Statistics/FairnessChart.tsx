
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useStats } from '../../hooks/useStats';

import Error from '../ui/Error';

// ...

const FairnessChart: React.FC<{ scheduleId: string }> = ({ scheduleId }) => {
  // ...
  if (isLoading) return <div>Yükleniyor...</div>;
  if (isError) return <Error message="Grafik yüklenirken bir hata oluştu." />;


  const data = stats?.nurses.map(nurse => ({
    name: nurse.nurseName,
    'Toplam Saat': nurse.totalHours,
    'Gece Nöbeti': nurse.nightShiftCount,
    'Haftasonu Nöbeti': nurse.weekendShiftCount,
  }));

  return (
    <div className="mt-4" style={{ width: '100%', height: 300 }}>
      <h3 className="text-xl font-bold">Adalet Grafiği</h3>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Toplam Saat" fill="#8884d8" />
          <Bar dataKey="Gece Nöbeti" fill="#82ca9d" />
          <Bar dataKey="Haftasonu Nöbeti" fill="#ffc658" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FairnessChart;
