
import api from './api';
import {
  ApiListResponse,
  ApiNurse,
  ApiResponse,
  Nurse,
  NurseRole
} from '../types/entities';
import { mapNurse } from '../utils/transformers';

export interface NursePayload {
  name: string;
  role: NurseRole;
}

export const getNurses = async (): Promise<Nurse[]> => {
  const response = await api.get<ApiListResponse<ApiNurse>>('/nurses');
  return response.data.data.map(mapNurse);
};

export const createNurse = async (nurse: NursePayload): Promise<Nurse> => {
  const response = await api.post<ApiResponse<ApiNurse>>('/nurses', nurse);
  return mapNurse(response.data.data);
};

export const updateNurse = async (id: string, nurse: Partial<NursePayload>): Promise<Nurse> => {
  const response = await api.put<ApiResponse<ApiNurse>>(`/nurses/${id}`, nurse);
  return mapNurse(response.data.data);
};

export const deleteNurse = async (id: string): Promise<void> => {
  await api.delete(`/nurses/${id}`);
};
