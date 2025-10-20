import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

const ScheduleEditor: React.FC = () => {
  const { month } = useParams<{ month: string }>();
  return <Navigate to={`/?month=${month}`} />;
};

export default ScheduleEditor;