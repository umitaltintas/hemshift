import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createLeave, deleteLeave, getLeaves, LeavePayload, updateLeave } from '../services/leaveService';
import { Leave } from '../types/entities';

export const useLeaves = (month?: string) => {
  const queryClient = useQueryClient();

  const {
    data: leaves,
    isLoading,
    isError
  } = useQuery<Leave[]>({
    queryKey: ['leaves', month],
    queryFn: () => getLeaves(month),
    enabled: !!month
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ['leaves']
    });

  const createLeaveMutation = useMutation({
    mutationFn: (payload: LeavePayload) => createLeave(payload),
    onSuccess: invalidate
  });

  const updateLeaveMutation = useMutation({
    mutationFn: ({ id, leave }: { id: string; leave: Partial<LeavePayload> }) =>
      updateLeave(id, leave),
    onSuccess: invalidate
  });

  const deleteLeaveMutation = useMutation({
    mutationFn: deleteLeave,
    onSuccess: invalidate
  });

  return {
    leaves,
    isLoading,
    isError,
    isCreating: createLeaveMutation.isPending,
    isUpdating: updateLeaveMutation.isPending,
    isDeleting: deleteLeaveMutation.isPending,
    createLeave: createLeaveMutation.mutate,
    createLeaveAsync: createLeaveMutation.mutateAsync,
    updateLeave: updateLeaveMutation.mutate,
    updateLeaveAsync: updateLeaveMutation.mutateAsync,
    deleteLeave: deleteLeaveMutation.mutate,
    deleteLeaveAsync: deleteLeaveMutation.mutateAsync
  };
};
