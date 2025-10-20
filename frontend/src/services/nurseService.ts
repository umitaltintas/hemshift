
import api from './api';
import { Nurse } from '../../../shared/types';

export const getNurses = async (): Promise<Nurse[]> => {
  const response = await api.get('/nurses');
  return response.data.data;
};

export const createNurse = async (nurse: Omit<Nurse, 'id' | 'createdAt' | 'updatedAt'>): Promise<Nurse> => {
  const response = await api.post('/nurses', nurse);
  return response.data.data;
};

export const updateNurse = async (id: string, nurse: Partial<Omit<Nurse, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Nurse> => {
  const response = await api.put(`/nurses/${id}`, nurse);
  return response.data.data;
};

export const deleteNurse = async (id: string): Promise<void> => {
  await api.delete(`/nurses/${id}`);
};
