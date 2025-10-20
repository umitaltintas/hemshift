
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Nurse } from '../../../../shared/types';

interface DraggableNurseProps {
  nurse: Nurse;
}

const DraggableNurse: React.FC<DraggableNurseProps> = ({ nurse }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: nurse.id,
    data: { nurse },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="p-1 bg-blue-200 rounded-md cursor-grab">
      {nurse.name}
    </div>
  );
};

export default DraggableNurse;
