import React from 'react';
import { FairnessScore } from '../../types/entities';

interface FairnessSummaryProps {
  fairness: FairnessScore;
}

const FairnessSummary: React.FC<FairnessSummaryProps> = ({ fairness }) => {
  const cards = [
    {
      label: 'Genel Adalet',
      value: fairness.overall,
      description: 'Gece, haftasonu ve toplam saat dengesi',
      accent: 'bg-indigo-100 text-indigo-700'
    },
    {
      label: 'Saat Dengesi',
      value: fairness.hoursScore,
      description: `Std. Sapma: ${fairness.hoursStdDev.toFixed(2)} saat`,
      accent: 'bg-slate-100 text-slate-700'
    },
    {
      label: 'Gece Nöbeti',
      value: fairness.nightsScore,
      description: `Std. Sapma: ${fairness.nightsStdDev.toFixed(2)}`,
      accent: 'bg-emerald-100 text-emerald-700'
    },
    {
      label: 'Haftasonu',
      value: fairness.weekendsScore,
      description: `Std. Sapma: ${fairness.weekendsStdDev.toFixed(2)}`,
      accent: 'bg-amber-100 text-amber-700'
    }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${card.accent}`}>
            {card.label}
          </span>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{card.value.toFixed(1)}</p>
          <p className="mt-1 text-sm text-gray-500">{card.description}</p>
          <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-indigo-500"
              style={{ width: `${Math.min(card.value, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </section>
  );
};

export default FairnessSummary;
