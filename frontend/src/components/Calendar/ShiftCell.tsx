
import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface ShiftCellProps {
  shiftId: string;
  children: React.ReactNode;
}

const ShiftCell: React.FC<ShiftCellProps> = ({ shiftId, children }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: shiftId,
  });

  return (
    <div ref={setNodeRef} className={`p-2 border ${isOver ? 'bg-green-200' : 'bg-white'}`}>
      {children}
    </div>
  );
};

export default ShiftCell;
