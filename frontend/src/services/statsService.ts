
import api from './api';
import { ApiMonthlyStats, ApiResponse, MonthlyStats } from '../types/entities';
import { mapMonthlyStats } from '../utils/transformers';

export const getMonthlyStats = async (scheduleId: string): Promise<MonthlyStats> => {
  const response = await api.get<ApiResponse<ApiMonthlyStats>>(`/stats/monthly/${scheduleId}`);
  return mapMonthlyStats(response.data.data);
};
