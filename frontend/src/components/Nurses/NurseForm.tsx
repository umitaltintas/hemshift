
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNurses } from '../../hooks/useNurses';
import { Nurse } from '../../../../shared/types';

const nurseSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  role: z.enum(['staff', 'responsible']),
});


type NurseFormData = z.infer<typeof nurseSchema>;

const NurseForm: React.FC = () => {
  const { createNurse } = useNurses();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<NurseFormData>({
    resolver: zodResolver(nurseSchema),
  });

  const onSubmit = (data: NurseFormData) => {
    createNurse(data as Omit<Nurse, 'id' | 'createdAt' | 'updatedAt'>);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 p-4 border rounded-md bg-gray-50">
      <h3 className="text-lg font-medium leading-6 text-gray-900">Yeni Hemşire Ekle</h3>
      <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            İsim
          </label>
          <div className="mt-1">
            <input
              {...register('name')}
              id="name"
              type="text"
              placeholder="İsim"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
            {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Rol
          </label>
          <div className="mt-1">
            <select
              {...register('role')}
              id="role"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="staff">Staff</option>
              <option value="responsible">Sorumlu</option>
            </select>
            {errors.role && <p className="mt-2 text-sm text-red-600">{errors.role.message}</p>}
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

export default NurseForm;
