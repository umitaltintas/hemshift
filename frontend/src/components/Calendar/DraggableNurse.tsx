
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Nurse } from '../../types/entities';

interface DraggableNurseProps {
  nurse: Nurse;
}

const DraggableNurse: React.FC<DraggableNurseProps> = ({ nurse }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: nurse.id,
    data: { type: 'nurse', nurse }
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50
      }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      className={`inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-100 ${isDragging ? 'cursor-grabbing opacity-80' : 'cursor-grab'}`}
      {...listeners}
      {...attributes}
    >
      <span className="h-2 w-2 rounded-full bg-indigo-400" />
      <span>{nurse.name}</span>
      <span className="text-xs uppercase tracking-wide text-indigo-400">
        {nurse.role === 'responsible' ? 'Sorumlu' : 'Staf'}
      </span>
    </button>
  );
};

export default DraggableNurse;
