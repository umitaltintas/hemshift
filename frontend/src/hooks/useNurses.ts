import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createNurse, deleteNurse, getNurses, NursePayload, updateNurse } from '../services/nurseService';
import { Nurse } from '../types/entities';

export const useNurses = () => {
  const queryClient = useQueryClient();

  const {
    data: nurses,
    isLoading,
    isError
  } = useQuery<Nurse[]>({
    queryKey: ['nurses'],
    queryFn: getNurses
  });

  const createNurseMutation = useMutation({
    mutationFn: (payload: NursePayload) => createNurse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurses'] });
    }
  });

  const updateNurseMutation = useMutation({
    mutationFn: ({ id, nurse }: { id: string; nurse: Partial<NursePayload> }) => updateNurse(id, nurse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurses'] });
    }
  });

  const deleteNurseMutation = useMutation({
    mutationFn: deleteNurse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurses'] });
    }
  });

  return {
    nurses,
    isLoading,
    isError,
    isCreating: createNurseMutation.isPending,
    isUpdating: updateNurseMutation.isPending,
    isDeleting: deleteNurseMutation.isPending,
    createNurse: createNurseMutation.mutate,
    createNurseAsync: createNurseMutation.mutateAsync,
    updateNurse: updateNurseMutation.mutate,
    updateNurseAsync: updateNurseMutation.mutateAsync,
    deleteNurse: deleteNurseMutation.mutate,
    deleteNurseAsync: deleteNurseMutation.mutateAsync
  };
};
