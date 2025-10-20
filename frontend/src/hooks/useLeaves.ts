
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLeaves, createLeave, updateLeave, deleteLeave } from '../services/leaveService';
import { Leave } from '../../../shared/types';

export const useLeaves = (month?: string) => {
  const queryClient = useQueryClient();

  const { data: leaves, isLoading, isError } = useQuery<Leave[]>({
    queryKey: ['leaves', month],
    queryFn: () => getLeaves(month),
    enabled: !!month,
  });

  const createLeaveMutation = useMutation({
    mutationFn: createLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });

  const updateLeaveMutation = useMutation({
    mutationFn: ({ id, leave }: { id: string, leave: Partial<Omit<Leave, 'id' | 'createdAt' | 'nurseName'>> }) => updateLeave(id, leave),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });

  const deleteLeaveMutation = useMutation({
    mutationFn: deleteLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });

  return {
    leaves,
    isLoading,
    isError,
    createLeave: createLeaveMutation.mutate,
    updateLeave: updateLeaveMutation.mutate,
    deleteLeave: deleteLeaveMutation.mutate,
  };
};
