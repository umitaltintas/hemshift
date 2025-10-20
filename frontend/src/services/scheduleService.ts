
import api from './api';
import { Schedule } from '../../../shared/types';

export const getSchedule = async (month: string): Promise<Schedule> => {
  const response = await api.get(`/schedules/${month}`);
  return response.data.data;
};

export const getSchedules = async (): Promise<Schedule[]> => {
  const response = await api.get('/schedules');
  return response.data.data;
};

export const generateSchedule = async (month: string): Promise<Schedule> => {
  const response = await api.post('/schedules/generate', { month });
  return response.data.data;
};

export const updateShiftAssignment = async (shiftId: string, nurseId: string): Promise<void> => {
  await api.post(`/shifts/${shiftId}/assign`, { nurseId });
};

export const removeShiftAssignment = async (assignmentId: string): Promise<void> => {
  await api.delete(`/assignments/${assignmentId}`);
};
