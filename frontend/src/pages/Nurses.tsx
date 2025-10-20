import React from 'react';
import { NurseList, NurseForm } from '../components/Nurses';

const Nurses: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold">Hemşireler</h2>
      <NurseForm />
      <NurseList />
    </div>
  );
};

export default Nurses;