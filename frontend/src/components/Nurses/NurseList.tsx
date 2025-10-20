import React, { useMemo, useState } from 'react';
import { Nurse } from '../../types/entities';
import { NursePayload } from '../../services/nurseService';
import { getErrorMessage } from '../../utils/errors';

interface NurseListProps {
  nurses?: Nurse[];
  isLoading: boolean;
  isError: boolean;
  onUpdate: (id: string, payload: Partial<NursePayload>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

const roleLabels: Record<Nurse['role'], string> = {
  responsible: 'Sorumlu',
  staff: 'Staf'
};

const NurseList: React.FC<NurseListProps> = ({
  nurses,
  isLoading,
  isError,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const staffCount = useMemo(
    () => (nurses ?? []).filter((nurse) => nurse.role === 'staff').length,
    [nurses]
  );
  const responsibleCount = useMemo(
    () => (nurses ?? []).filter((nurse) => nurse.role === 'responsible').length,
    [nurses]
  );

  if (isLoading) {
    return <div className="rounded-lg border border-dashed border-gray-200 p-4 text-gray-500">Hemşire listesi yükleniyor...</div>;
  }

  if (isError) {
    return <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Hemşireler yüklenirken bir hata oluştu.</div>;
  }

  const startEdit = (nurse: Nurse) => {
    setEditingId(nurse.id);
    setEditValue(nurse.name);
    setFeedback(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const trimmed = editValue.trim();
    if (trimmed.length < 2) {
      setFeedback({ type: 'error', text: 'İsim en az 2 karakter olmalı' });
      return;
    }
    try {
      await onUpdate(editingId, { name: trimmed });
      setFeedback({ type: 'success', text: 'Hemşire adı güncellendi' });
      cancelEdit();
    } catch (error) {
      setFeedback({ type: 'error', text: getErrorMessage(error, 'Hemşire güncellenemedi') });
    }
  };

  const removeNurse = async (nurse: Nurse) => {
    const confirmed = window.confirm(
      `${nurse.name} kaydını silmek istediğinize emin misiniz? Bu hemşirenin vardiya atamaları da kaldırılır.`
    );
    if (!confirmed) return;
    try {
      await onDelete(nurse.id);
      setFeedback({ type: 'success', text: `${nurse.name} kaydı silindi` });
    } catch (error) {
      setFeedback({ type: 'error', text: getErrorMessage(error, 'Hemşire silinemedi') });
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Kayıtlı Hemşireler</h3>
          <p className="text-sm text-gray-500">
            {responsibleCount} sorumlu, {staffCount} staf hemşire
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`mt-4 rounded-md border px-3 py-2 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">İsim</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Rol</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Oluşturma</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {nurses && nurses.length > 0 ? (
              nurses.map((nurse) => {
                const isEditing = editingId === nurse.id;
                return (
                  <tr key={nurse.id}>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          value={editValue}
                          onChange={(event) => setEditValue(event.target.value)}
                          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          disabled={isUpdating}
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{nurse.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          nurse.role === 'responsible'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {roleLabels[nurse.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(nurse.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
                              disabled={isUpdating}
                            >
                              Kaydet
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                            >
                              Vazgeç
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(nurse)}
                            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                          >
                            Düzenle
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeNurse(nurse)}
                          className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-rose-300"
                          disabled={isDeleting}
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={4}>
                  Kayıtlı hemşire bulunamadı. Önce hemşire ekleyin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default NurseList;
