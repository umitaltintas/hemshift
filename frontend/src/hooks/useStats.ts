
import { useQuery } from '@tanstack/react-query';
import { getMonthlyStats } from '../services/statsService';
import { MonthlyStats } from '../../../shared/types';

export const useStats = (scheduleId: string) => {
  const { data: stats, isLoading, isError } = useQuery<MonthlyStats>({
    queryKey: ['stats', scheduleId],
    queryFn: () => getMonthlyStats(scheduleId),
    enabled: !!scheduleId,
  });

  return {
    stats,
    isLoading,
    isError,
  };
};
