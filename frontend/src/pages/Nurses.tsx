import React, { useMemo } from 'react';
import { NurseForm, NurseList } from '../components/Nurses';
import { useNurses } from '../hooks/useNurses';

const Nurses: React.FC = () => {
  const {
    nurses,
    isLoading,
    isError,
    isCreating,
    isUpdating,
    isDeleting,
    createNurseAsync,
    updateNurseAsync,
    deleteNurseAsync
  } = useNurses();

  const { staffCount, responsibleCount } = useMemo(() => {
    const list = nurses ?? [];
    return {
      staffCount: list.filter((nurse) => nurse.role === 'staff').length,
      responsibleCount: list.filter((nurse) => nurse.role === 'responsible').length
    };
  }, [nurses]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hemşire Yönetimi</h2>
          <p className="text-sm text-gray-500">Planlama algoritması için sorumlu ve staf hemşirelerinizi yönetin.</p>
        </div>
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
          {responsibleCount} sorumlu · {staffCount} staf
        </div>
      </header>

      {responsibleCount === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Plan oluşturabilmek için en az bir sorumlu hemşire tanımlamalısınız.
        </div>
      )}

      {staffCount < 4 && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Adaletli planlama için minimum 4 staf hemşire gereklidir. Şu an kayıtlı {staffCount} staf hemşire bulunuyor.
        </div>
      )}

      <NurseForm
        nurses={nurses}
        onSubmit={async (payload) => {
          await createNurseAsync(payload);
        }}
        isSubmitting={isCreating}
      />

      <NurseList
        nurses={nurses}
        isLoading={isLoading}
        isError={isError}
        onUpdate={async (id, payload) => {
          await updateNurseAsync({ id, nurse: payload });
        }}
        onDelete={async (id) => {
          await deleteNurseAsync(id);
        }}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Nurses;
