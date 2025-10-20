
import { useQuery } from '@tanstack/react-query';
import { getSchedules } from '../services/scheduleService';
import { Schedule } from '../../../shared/types';

export const useSchedules = () => {
  const { data: schedules, isLoading, isError } = useQuery<Schedule[]>({
    queryKey: ['schedules'],
    queryFn: getSchedules,
  });

  return {
    schedules,
    isLoading,
    isError,
  };
};
