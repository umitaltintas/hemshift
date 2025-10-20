
import React from 'react';
import { useLeaves } from '../../hooks/useLeaves';
import { Leave } from '../../../../shared/types';

import Error from '../ui/Error';

const LeaveList: React.FC<{ month: string }> = ({ month }) => {
  const { leaves, isLoading, isError, deleteLeave } = useLeaves(month);

  if (isLoading) return <div>Yükleniyor...</div>;
  if (isError) return <Error message="İzinler yüklenirken bir hata oluştu." />;

  return (
    <div className="mt-4">
      <h3 className="text-xl font-bold">İzin Listesi</h3>
      <ul className="mt-2">
        {leaves?.map((leave: Leave) => (
          <li key={leave.id} className="flex justify-between items-center p-2 border-b">
            <span>{leave.nurseName} - {leave.type} ({leave.startDate} - {leave.endDate})</span>
            <button
              onClick={() => deleteLeave(leave.id)}
              className="px-2 py-1 bg-red-500 text-white rounded"
            >
              Sil
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LeaveList;
