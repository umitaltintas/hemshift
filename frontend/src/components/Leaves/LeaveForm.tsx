import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Nurse } from '../../types/entities';
import { LeavePayload } from '../../services/leaveService';
import { getErrorMessage } from '../../utils/errors';

const leaveSchema = z
  .object({
    nurseId: z.string().min(1, 'Hemşire seçin'),
    type: z.enum(['annual', 'excuse', 'sick', 'preference']),
    startDate: z.string().min(1, 'Başlangıç tarihi gerekli'),
    endDate: z.string().min(1, 'Bitiş tarihi gerekli'),
    notes: z.string().optional()
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'Bitiş tarihi başlangıç tarihinden önce olamaz',
    path: ['endDate']
  });

type LeaveFormData = z.infer<typeof leaveSchema>;

type LeaveFormProps = {
  nurses?: Nurse[];
  month: string;
  isSubmitting?: boolean;
  onSubmit: (payload: LeavePayload) => Promise<void>;
};

const typeLabels: Record<LeaveFormData['type'], string> = {
  annual: 'Yıllık İzin',
  excuse: 'Mazeret İzni',
  sick: 'Raporlu',
  preference: 'Boşluk Tercihi'
};

const getDefaultDates = (month: string) => {
  const start = `${month}-01`;
  return { start, end: start };
};

const LeaveForm: React.FC<LeaveFormProps> = ({ nurses = [], month, isSubmitting, onSubmit }) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const hasNurses = nurses.length > 0;
  const defaultDates = useMemo(() => getDefaultDates(month), [month]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      nurseId: nurses[0]?.id ?? '',
      type: 'annual',
      startDate: defaultDates.start,
      endDate: defaultDates.end,
      notes: ''
    }
  });

  useEffect(() => {
    reset({
      nurseId: nurses[0]?.id ?? '',
      type: 'annual',
      startDate: defaultDates.start,
      endDate: defaultDates.end,
      notes: ''
    });
  }, [nurses, defaultDates.start, defaultDates.end, reset]);

  const submitHandler = async (data: LeaveFormData) => {
    try {
      await onSubmit({
        nurseId: data.nurseId,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        notes: data.notes?.trim() ? data.notes.trim() : null
      });
      setFeedback({ type: 'success', text: 'İzin kaydı oluşturuldu' });
      reset({
        nurseId: data.nurseId,
        type: data.type,
        startDate: data.startDate,
        endDate: data.startDate,
        notes: ''
      });
    } catch (error) {
      setFeedback({ type: 'error', text: getErrorMessage(error, 'İzin kaydı oluşturulamadı') });
    }
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Yeni İzin Kaydı</h3>
          <p className="text-sm text-gray-500">Planlama algoritması izinleri otomatik olarak dikkate alır.</p>
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

      {!hasNurses && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          İzin tanımlamak için önce hemşire ekleyin.
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="nurseId" className="text-sm font-medium text-gray-700">
            Hemşire
          </label>
          <select
            {...register('nurseId')}
            id="nurseId"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={!hasNurses || isSubmitting}
          >
            {nurses.map((nurse) => (
              <option key={nurse.id} value={nurse.id}>
                {nurse.name}
              </option>
            ))}
          </select>
          {errors.nurseId && <p className="mt-1 text-xs text-rose-600">{errors.nurseId.message}</p>}
        </div>

        <div>
          <label htmlFor="type" className="text-sm font-medium text-gray-700">
            İzin Tipi
          </label>
          <select
            {...register('type')}
            id="type"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={isSubmitting}
          >
            {Object.entries(typeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.type && <p className="mt-1 text-xs text-rose-600">{errors.type.message}</p>}
        </div>

        <div>
          <label htmlFor="startDate" className="text-sm font-medium text-gray-700">
            Başlangıç Tarihi
          </label>
          <input
            {...register('startDate')}
            id="startDate"
            type="date"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={isSubmitting}
          />
          {errors.startDate && <p className="mt-1 text-xs text-rose-600">{errors.startDate.message}</p>}
        </div>

        <div>
          <label htmlFor="endDate" className="text-sm font-medium text-gray-700">
            Bitiş Tarihi
          </label>
          <input
            {...register('endDate')}
            id="endDate"
            type="date"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={isSubmitting}
          />
          {errors.endDate && <p className="mt-1 text-xs text-rose-600">{errors.endDate.message}</p>}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="notes" className="text-sm font-medium text-gray-700">
          Notlar (opsiyonel)
        </label>
        <textarea
          {...register('notes')}
          id="notes"
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Örn. Hemşire talebi üzerine"
          disabled={isSubmitting}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !hasNurses}
          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {isSubmitting ? 'Kaydediliyor...' : 'İzin Ekle'}
        </button>
      </div>
    </form>
  );
};

export default LeaveForm;
