import React from 'react';
import type { Schedule } from '../../types/entities';

interface DashboardWarningsProps {
  schedule: Schedule | null;
}

export const DashboardWarnings: React.FC<DashboardWarningsProps> = ({ schedule }) => {
  if (!schedule?.warnings || schedule.warnings.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-amber-800">Uyarılar</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
        {schedule.warnings.map((warning, index) => (
          <li key={`${warning}-${index}`}>{warning}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-amber-700">
        Uyarılar algoritmanın önerdiği potansiyel iyileştirmelerdir. Manuel atamalarla güncelleyebilirsiniz.
      </p>
    </section>
  );
};
