
import React from 'react';
import { useNurses } from '../../hooks/useNurses';
import { Nurse } from '../../../../shared/types';

import Error from '../ui/Error';

const NurseList: React.FC = () => {
  const { nurses, isLoading, isError, deleteNurse } = useNurses();

  if (isLoading) return <div>Yükleniyor...</div>;
  if (isError) return <Error message="Hemşireler yüklenirken bir hata oluştu." />;

  return (
    <div className="mt-4">
      <h3 className="text-xl font-bold">Hemşire Listesi</h3>
      <ul className="mt-2">
        {nurses?.map((nurse: Nurse) => (
          <li key={nurse.id} className="flex justify-between items-center p-2 border-b">
            <span>{nurse.name} - {nurse.role}</span>
            <button
              onClick={() => deleteNurse(nurse.id)}
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

export default NurseList;
