
import api from './api';
import { Leave } from '../../../shared/types';

export const getLeaves = async (month?: string): Promise<Leave[]> => {
  const response = await api.get('/leaves', { params: { month } });
  return response.data.data;
};

export const createLeave = async (leave: Omit<Leave, 'id' | 'createdAt' | 'nurseName'>): Promise<Leave> => {
  const response = await api.post('/leaves', leave);
  return response.data.data;
};

export const updateLeave = async (id: string, leave: Partial<Omit<Leave, 'id' | 'createdAt' | 'nurseName'>>): Promise<Leave> => {
  const response = await api.put(`/leaves/${id}`, leave);
  return response.data.data;
};

export const deleteLeave = async (id: string): Promise<void> => {
  await api.delete(`/leaves/${id}`);
};
