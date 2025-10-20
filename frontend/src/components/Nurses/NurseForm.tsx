import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Nurse } from '../../types/entities';
import { NursePayload } from '../../services/nurseService';
import { getErrorMessage } from '../../utils/errors';

const nurseSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  role: z.enum(['staff', 'responsible'])
});

type NurseFormData = z.infer<typeof nurseSchema>;

interface NurseFormProps {
  nurses?: Nurse[];
  onSubmit: (payload: NursePayload) => Promise<void>;
  isSubmitting?: boolean;
}

const NurseForm: React.FC<NurseFormProps> = ({ nurses = [], onSubmit, isSubmitting }) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const responsibleExists = useMemo(
    () => nurses.some((nurse) => nurse.role === 'responsible'),
    [nurses]
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<NurseFormData>({
    resolver: zodResolver(nurseSchema),
    defaultValues: {
      name: '',
      role: responsibleExists ? 'staff' : 'responsible'
    }
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (responsibleExists && selectedRole === 'responsible') {
      setValue('role', 'staff');
    }
  }, [responsibleExists, selectedRole, setValue]);

  const submitHandler = async (data: NurseFormData) => {
    try {
      await onSubmit({
        name: data.name.trim(),
        role: data.role
      });
      setFeedback({
        type: 'success',
        text: 'Hemşire başarıyla eklendi'
      });
      reset({
        name: '',
        role: responsibleExists ? 'staff' : 'responsible'
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: getErrorMessage(error, 'Hemşire eklenirken bir hata oluştu')
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Yeni Hemşire Ekle</h3>
          <p className="text-sm text-gray-500">Sistem sorumlusu ve staf hemşirelerinizi yönetin.</p>
        </div>
        <span className="text-xs text-gray-400">Zorunlu alanlar *</span>
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

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-gray-700">
            İsim *
          </label>
          <input
            {...register('name')}
            id="name"
            type="text"
            placeholder="Örn. Ayşe Yılmaz"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={isSubmitting}
          />
          {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="role" className="text-sm font-medium text-gray-700">
            Rol *
          </label>
          <select
            {...register('role')}
            id="role"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={isSubmitting}
          >
            <option value="staff">Staf</option>
            <option value="responsible" disabled={responsibleExists}>
              Sorumlu
            </option>
          </select>
          {responsibleExists ? (
            <p className="mt-1 text-xs text-gray-500">
              Sistemde bir sorumlu hemşire bulunuyor. Yeni kayıtlar staf olarak eklenir.
            </p>
          ) : (
            <p className="mt-1 text-xs text-emerald-600">
              Henüz sorumlu hemşire yok. İlk kaydı sorumlu olarak ekleyin.
            </p>
          )}
          {errors.role && <p className="mt-1 text-xs text-rose-600">{errors.role.message}</p>}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {isSubmitting ? 'Kaydediliyor...' : 'Hemşireyi Ekle'}
        </button>
      </div>
    </form>
  );
};

export default NurseForm;
