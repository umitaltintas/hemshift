import React, { useState } from 'react';
import { LeaveList, LeaveForm } from '../components/Leaves';
import { format } from 'date-fns';

const Leaves: React.FC = () => {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));

  return (
    <div>
      <h2 className="text-2xl font-bold">İzinler</h2>
      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="p-2 border rounded mt-4"
      />
      <LeaveForm />
      <LeaveList month={month} />
    </div>
  );
};

export default Leaves;