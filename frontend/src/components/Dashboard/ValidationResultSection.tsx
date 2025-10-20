import React from 'react';
import type { ValidationResult } from '../../types/entities';

interface ValidationResultSectionProps {
  validationResult: ValidationResult | null;
}

export const ValidationResultSection: React.FC<ValidationResultSectionProps> = ({
  validationResult
}) => {
  if (!validationResult) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Doğrulama Sonucu</h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            validationResult.isValid
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          {validationResult.isValid ? 'Geçerli' : 'Hatalar Var'}
        </span>
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {/* Errors Column */}
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Hatalar
          </h4>
          {validationResult.errors.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-700">
              {validationResult.errors.map((error, index) => (
                <li key={`${error}-${index}`}>{error}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Hata bulunamadı.</p>
          )}
        </div>

        {/* Warnings Column */}
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Uyarılar
          </h4>
          {validationResult.warnings.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700">
              {validationResult.warnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Uyarı bulunamadı.</p>
          )}
        </div>
      </div>
    </section>
  );
};
