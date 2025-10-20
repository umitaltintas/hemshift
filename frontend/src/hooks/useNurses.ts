
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNurses, createNurse, updateNurse, deleteNurse } from '../services/nurseService';
import { Nurse } from '../../../shared/types';

export const useNurses = () => {
  const queryClient = useQueryClient();

  const { data: nurses, isLoading, isError } = useQuery<Nurse[]>({
    queryKey: ['nurses'],
    queryFn: getNurses,
  });

  const createNurseMutation = useMutation({
    mutationFn: createNurse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurses'] });
    },
  });

  const updateNurseMutation = useMutation({
    mutationFn: ({ id, nurse }: { id: string, nurse: Partial<Omit<Nurse, 'id' | 'createdAt' | 'updatedAt'>> }) => updateNurse(id, nurse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurses'] });
    },
  });

  const deleteNurseMutation = useMutation({
    mutationFn: deleteNurse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurses'] });
    },
  });

  return {
    nurses,
    isLoading,
    isError,
    createNurse: createNurseMutation.mutate,
    updateNurse: updateNurseMutation.mutate,
    deleteNurse: deleteNurseMutation.mutate,
  };
};
