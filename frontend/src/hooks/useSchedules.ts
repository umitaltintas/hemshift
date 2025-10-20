import { useQuery } from '@tanstack/react-query';
import { getSchedules } from '../services/scheduleService';
import { ScheduleListItem } from '../types/entities';

export const useSchedules = () => {
  const {
    data: schedules,
    isLoading,
    isError
  } = useQuery<ScheduleListItem[]>({
    queryKey: ['schedules'],
    queryFn: getSchedules
  });

  return {
    schedules,
    isLoading,
    isError
  };
};
