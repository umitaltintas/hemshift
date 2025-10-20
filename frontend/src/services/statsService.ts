
import api from './api';
import { MonthlyStats } from '../../../shared/types';

export const getMonthlyStats = async (scheduleId: string): Promise<MonthlyStats> => {
  const response = await api.get(`/stats/monthly/${scheduleId}`);
  return response.data.data;
};
