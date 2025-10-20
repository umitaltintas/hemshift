import api from './api';
import {
  ApiLeave,
  ApiListResponse,
  ApiResponse,
  Leave,
  LeaveType
} from '../types/entities';
import { mapLeave } from '../utils/transformers';

export interface LeavePayload {
  nurseId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  notes?: string | null;
}

const toApiPayload = (payload: Partial<LeavePayload>) => ({
  nurse_id: payload.nurseId,
  type: payload.type,
  start_date: payload.startDate,
  end_date: payload.endDate,
  notes: payload.notes
});

export const getLeaves = async (month?: string): Promise<Leave[]> => {
  const response = await api.get<ApiListResponse<ApiLeave>>('/leaves', {
    params: { month }
  });
  return response.data.data.map(mapLeave);
};

export const createLeave = async (leave: LeavePayload): Promise<Leave> => {
  const response = await api.post<ApiResponse<ApiLeave>>('/leaves', toApiPayload(leave));
  return mapLeave(response.data.data);
};

export const updateLeave = async (id: string, leave: Partial<LeavePayload>): Promise<Leave> => {
  const response = await api.put<ApiResponse<ApiLeave>>(`/leaves/${id}`, toApiPayload(leave));
  return mapLeave(response.data.data);
};

export const deleteLeave = async (id: string): Promise<void> => {
  await api.delete(`/leaves/${id}`);
};
