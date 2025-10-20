import React from 'react';
import { Shift } from '../../types/entities';
import BoardShiftCard from './BoardShiftCard';

interface BoardColumnProps {
  title: string;
  shiftType: Shift['type'];
  shifts: Shift[];
  onRemove: (assignmentId: string) => void;
  colorClass: string;
}

const BoardColumn: React.FC<BoardColumnProps> = ({
  title,
  shiftType,
  shifts,
  onRemove,
  colorClass
}) => {
  const sortedShifts = [...shifts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className={`flex-shrink-0 w-80 rounded-xl border p-4 shadow-sm h-fit ${colorClass}`}>
      <div className="mb-4 pb-3 border-b border-dashed border-gray-300">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{shifts.length} vardiya</p>
      </div>

      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {sortedShifts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Bu ay için {title.toLowerCase()} bulunmuyor</p>
          </div>
        ) : (
          sortedShifts.map((shift) => (
            <BoardShiftCard
              key={shift.id}
              shift={shift}
              onRemove={onRemove}
              shiftType={shiftType}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default BoardColumn;
