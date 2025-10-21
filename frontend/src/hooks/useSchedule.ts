import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clearSchedule,
  exportSchedule,
  generateSchedule,
  getSchedule,
  publishSchedule,
  removeShiftAssignment,
  updateShiftAssignment,
  validateSchedule
} from '../services/scheduleService';
import { Schedule, ValidationResult } from '../types/entities';

export const useSchedule = (month: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['schedule', month] as const;

  const {
    data: schedule,
    isLoading,
    isError
  } = useQuery<Schedule | null>({
    queryKey,
    queryFn: async () => {
      try {
        return await getSchedule(month);
      } catch (error) {
        if (error instanceof Error && error.message.includes('plan bulunamadı')) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!month
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['schedules'] });
  };

  const generateScheduleMutation = useMutation({
    mutationFn: (targetMonth: string) => generateSchedule(targetMonth),
    onSuccess: invalidate
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({ shiftId, nurseId }: { shiftId: string; nurseId: string }) =>
      updateShiftAssignment(shiftId, nurseId),
    onSuccess: invalidate
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: removeShiftAssignment,
    onSuccess: invalidate
  });

  const publishMutation = useMutation({
    mutationFn: publishSchedule,
    onSuccess: invalidate
  });

  const validateMutation = useMutation({
    mutationFn: validateSchedule
  });

  const exportMutation = useMutation({
    mutationFn: ({ scheduleId, format }: { scheduleId: string; format: 'excel' | 'csv' }) =>
      exportSchedule(scheduleId, format)
  });

  const clearMutation = useMutation({
    mutationFn: clearSchedule,
    onSuccess: invalidate
  });

  return {
    schedule,
    isLoading,
    isError,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
    generateSchedule: generateScheduleMutation.mutate,
    generateScheduleAsync: generateScheduleMutation.mutateAsync,
    updateAssignment: updateAssignmentMutation.mutate,
    updateAssignmentAsync: updateAssignmentMutation.mutateAsync,
    removeAssignment: removeAssignmentMutation.mutate,
    removeAssignmentAsync: removeAssignmentMutation.mutateAsync,
    publishSchedule: publishMutation.mutate,
    publishScheduleAsync: publishMutation.mutateAsync,
    validateSchedule: validateMutation.mutateAsync as (scheduleId: string) => Promise<ValidationResult>,
    exportSchedule: exportMutation.mutateAsync,
    clearScheduleAsync: clearMutation.mutateAsync
  };
};
