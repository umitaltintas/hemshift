
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLeaves } from '../../hooks/useLeaves';
import { useNurses } from '../../hooks/useNurses';
import { Leave } from '../../../../shared/types';

const leaveSchema = z.object({
  nurseId: z.string(),
  type: z.enum(['annual', 'excuse', 'sick', 'preference']),
  startDate: z.string(),
  endDate: z.string(),
  notes: z.string().optional(),
});

type LeaveFormData = z.infer<typeof leaveSchema>;

const LeaveForm: React.FC = () => {
  const { createLeave } = useLeaves();
  const { nurses } = useNurses();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
  });

  const onSubmit = (data: LeaveFormData) => {
    createLeave(data as Omit<Leave, 'id' | 'createdAt' | 'nurseName'>);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 p-4 border rounded-md bg-gray-50">
      <h3 className="text-lg font-medium leading-6 text-gray-900">Yeni İzin Ekle</h3>
      <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
        <div>
          <label htmlFor="nurseId" className="block text-sm font-medium text-gray-700">
            Hemşire
          </label>
          <div className="mt-1">
            <select
              {...register('nurseId')}
              id="nurseId"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              {nurses?.map(nurse => (
                <option key={nurse.id} value={nurse.id}>{nurse.name}</option>
              ))}
            </select>
            {errors.nurseId && <p className="mt-2 text-sm text-red-600">{errors.nurseId.message}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            İzin Tipi
          </label>
          <div className="mt-1">
            <select
              {...register('type')}
              id="type"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="annual">Yıllık İzin</option>
              <option value="excuse">Mazeret İzni</option>
              <option value="sick">Raporlu</option>
              <option value="preference">Boşluk Tercihi</option>
            </select>
            {errors.type && <p className="mt-2 text-sm text-red-600">{errors.type.message}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Başlangıç Tarihi
          </label>
          <div className="mt-1">
            <input
              {...register('startDate')}
              id="startDate"
              type="date"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
            {errors.startDate && <p className="mt-2 text-sm text-red-600">{errors.startDate.message}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            Bitiş Tarihi
          </label>
          <div className="mt-1">
            <input
              {...register('endDate')}
              id="endDate"
              type="date"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
            {errors.endDate && <p className="mt-2 text-sm text-red-600">{errors.endDate.message}</p>}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notlar
          </label>
          <div className="mt-1">
            <textarea
              {...register('notes')}
              id="notes"
              rows={3}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>
      <div className="mt-4">
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Ekle
        </button>
      </div>
    </form>
  );
};

export default LeaveForm;
