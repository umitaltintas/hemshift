import React, { useState } from 'react';
import { format } from 'date-fns';
import { LeaveForm, LeaveList } from '../components/Leaves';
import { useLeaves } from '../hooks/useLeaves';
import { useNurses } from '../hooks/useNurses';

const Leaves: React.FC = () => {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const {
    leaves,
    isLoading,
    isError,
    isCreating,
    isUpdating,
    isDeleting,
    createLeaveAsync,
    updateLeaveAsync,
    deleteLeaveAsync
  } = useLeaves(month);
  const { nurses, isLoading: nursesLoading } = useNurses();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">İzin Yönetimi</h2>
          <p className="text-sm text-gray-500">
            Aylık planlama sürecinde dikkate alınacak izinleri yönetin. Tarih aralığı planlama ayı ile uyumlu olmalıdır.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="leave-month" className="text-sm font-medium text-gray-600">
            Ay Seçimi
          </label>
          <input
            id="leave-month"
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </header>

      <LeaveForm
        nurses={nurses}
        month={month}
        onSubmit={async (payload) => {
          await createLeaveAsync(payload);
        }}
        isSubmitting={isCreating || nursesLoading}
      />

      <LeaveList
        leaves={leaves}
        nurses={nurses}
        isLoading={isLoading}
        isError={isError}
        onUpdate={async (id, payload) => {
          await updateLeaveAsync({ id, leave: payload });
        }}
        onDelete={async (id) => {
          await deleteLeaveAsync(id);
        }}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Leaves;
