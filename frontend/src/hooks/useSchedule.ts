
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSchedule, generateSchedule, updateShiftAssignment, removeShiftAssignment } from '../services/scheduleService';
import { Schedule } from '../../../shared/types';

export const useSchedule = (month: string) => {
  const queryClient = useQueryClient();

  const { data: schedule, isLoading, isError } = useQuery<Schedule>({
    queryKey: ['schedule', month],
    queryFn: () => getSchedule(month),
    enabled: !!month,
  });

  const generateScheduleMutation = useMutation({
    mutationFn: generateSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({ shiftId, nurseId }: { shiftId: string, nurseId: string }) => updateShiftAssignment(shiftId, nurseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: removeShiftAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });

  return {
    schedule,
    isLoading,
    isError,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['schedule', month] }),
    generateSchedule: generateScheduleMutation.mutate,
    updateAssignment: updateAssignmentMutation.mutate,
    removeAssignment: removeAssignmentMutation.mutate,
  };
};
