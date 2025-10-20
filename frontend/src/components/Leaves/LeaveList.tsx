import React, { useMemo, useState } from 'react';
import { Leave, Nurse } from '../../types/entities';
import { LeavePayload } from '../../services/leaveService';
import { getErrorMessage } from '../../utils/errors';

interface LeaveListProps {
  leaves?: Leave[];
  nurses?: Nurse[];
  isLoading: boolean;
  isError: boolean;
  onUpdate: (id: string, payload: Partial<LeavePayload>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

const typeLabels: Record<Leave['type'], string> = {
  annual: 'Yıllık İzin',
  excuse: 'Mazeret İzni',
  sick: 'Raporlu',
  preference: 'Boşluk Tercihi'
};

const LeaveList: React.FC<LeaveListProps> = ({
  leaves,
  nurses,
  isLoading,
  isError,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LeavePayload | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const nurseOptions = useMemo(() => nurses ?? [], [nurses]);

  if (isLoading) {
    return <div className="rounded-lg border border-dashed border-gray-200 p-4 text-gray-500">İzin kayıtları yükleniyor...</div>;
  }

  if (isError) {
    return <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">İzin kayıtları yüklenirken bir hata oluştu.</div>;
  }

  const startEdit = (leave: Leave) => {
    setEditingId(leave.id);
    setForm({
      nurseId: leave.nurseId,
      type: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate,
      notes: leave.notes
    });
    setFeedback(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(null);
  };

  const handleChange = (field: keyof LeavePayload, value: string | null) => {
    setForm((prev) => {
      if (!prev) return prev;
      if (field === 'notes') {
        const nextValue = value && value.trim().length > 0 ? value : null;
        return { ...prev, notes: nextValue };
      }
      return {
        ...prev,
        [field]: value ?? ''
      } as LeavePayload;
    });
  };

  const saveEdit = async () => {
    if (!editingId || !form) return;
    if (!form.startDate || !form.endDate || form.startDate > form.endDate) {
      setFeedback({ type: 'error', text: 'Geçerli bir tarih aralığı seçin' });
      return;
    }
    try {
      await onUpdate(editingId, {
        nurseId: form.nurseId,
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        notes: form.notes ?? undefined
      });
      setFeedback({ type: 'success', text: 'İzin kaydı güncellendi' });
      cancelEdit();
    } catch (error) {
      setFeedback({ type: 'error', text: getErrorMessage(error, 'İzin kaydı güncellenemedi') });
    }
  };

  const deleteLeave = async (leave: Leave) => {
    const confirmed = window.confirm(
      `${leave.nurseName} (${typeLabels[leave.type]}) kaydını silmek istediğinize emin misiniz?`
    );
    if (!confirmed) return;
    try {
      await onDelete(leave.id);
      setFeedback({ type: 'success', text: 'İzin kaydı silindi' });
    } catch (error) {
      setFeedback({ type: 'error', text: getErrorMessage(error, 'İzin kaydı silinemedi') });
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">Tanımlı İzinler</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {leaves?.length ?? 0} kayıt
        </span>
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
              <th className="px-4 py-3 text-left font-medium text-gray-500">Hemşire</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Tip</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Tarih Aralığı</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Notlar</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {leaves && leaves.length > 0 ? (
              leaves.map((leave) => {
                const isEditing = editingId === leave.id;
                return (
                  <React.Fragment key={leave.id}>
                    <tr className={isEditing ? 'bg-indigo-50/40' : undefined}>
                      <td className="px-4 py-3 font-medium text-gray-900">{leave.nurseName}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {typeLabels[leave.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {leave.startDate} → {leave.endDate}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {leave.notes ? leave.notes : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(leave)}
                            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                          >
                            Düzenle
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteLeave(leave)}
                            className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-rose-300"
                            disabled={isDeleting}
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isEditing && form && (
                      <tr className="bg-indigo-50/60">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="grid gap-3 lg:grid-cols-4">
                            <div>
                              <label className="text-xs font-medium text-gray-600">Hemşire</label>
                              <select
                                value={form.nurseId}
                                onChange={(event) => handleChange('nurseId', event.target.value)}
                                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                disabled={isUpdating}
                              >
                                {nurseOptions.map((nurse) => (
                                  <option key={nurse.id} value={nurse.id}>
                                    {nurse.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">İzin Tipi</label>
                              <select
                                value={form.type}
                                onChange={(event) => handleChange('type', event.target.value)}
                                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                disabled={isUpdating}
                              >
                                {Object.entries(typeLabels).map(([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Başlangıç</label>
                              <input
                                type="date"
                                value={form.startDate}
                                onChange={(event) => handleChange('startDate', event.target.value)}
                                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                disabled={isUpdating}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600">Bitiş</label>
                              <input
                                type="date"
                                value={form.endDate}
                                onChange={(event) => handleChange('endDate', event.target.value)}
                                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                disabled={isUpdating}
                              />
                            </div>
                            <div className="lg:col-span-4">
                              <label className="text-xs font-medium text-gray-600">Notlar</label>
                              <textarea
                                value={form.notes ?? ''}
                                onChange={(event) => handleChange('notes', event.target.value)}
                                rows={2}
                                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                disabled={isUpdating}
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end gap-2">
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
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={5}>
                  Seçili ay için izin kaydı bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default LeaveList;
