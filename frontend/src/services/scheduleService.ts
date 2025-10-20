
import api from './api';
import {
  ApiResponse,
  ApiSchedule,
  ApiScheduleDetail,
  ApiValidationResult,
  Schedule,
  ScheduleListItem,
  ScheduleStatus,
  ValidationResult
} from '../types/entities';
import {
  mapScheduleDetail,
  mapScheduleList,
  mapValidationResult
} from '../utils/transformers';

interface GenerateSchedulePayload {
  month: string;
}

interface GenerateScheduleResponse {
  id: string;
  month: string;
  status: ScheduleStatus;
  fairness_score: number | null;
  warnings?: string[];
  generation_time_ms?: number;
}

interface UpdateSchedulePayload {
  status?: ScheduleStatus;
  fairness_score?: number;
}

export const getSchedule = async (month: string): Promise<Schedule> => {
  const response = await api.get<ApiResponse<ApiScheduleDetail>>(`/schedules/${month}`);
  return mapScheduleDetail(response.data.data);
};

export const getSchedules = async (): Promise<ScheduleListItem[]> => {
  const response = await api.get<ApiResponse<ApiSchedule[]>>('/schedules');
  return mapScheduleList(response.data.data);
};

export const generateSchedule = async (month: string): Promise<GenerateScheduleResponse> => {
  const response = await api.post<ApiResponse<GenerateScheduleResponse>>('/schedules/generate', { month } satisfies GenerateSchedulePayload);
  return response.data.data;
};

export const updateSchedule = async (id: string, payload: UpdateSchedulePayload): Promise<ScheduleListItem> => {
  const response = await api.put<ApiResponse<ApiSchedule>>(`/schedules/${id}`, payload);
  return mapScheduleList([response.data.data])[0];
};

export const publishSchedule = async (id: string): Promise<ScheduleListItem> => {
  const response = await api.post<ApiResponse<ApiSchedule>>(`/schedules/${id}/publish`, {});
  return mapScheduleList([response.data.data])[0];
};

export const validateSchedule = async (scheduleId: string): Promise<ValidationResult> => {
  const response = await api.post<ApiResponse<ApiValidationResult>>(`/schedules/${scheduleId}/validate`, {});
  return mapValidationResult(response.data.data);
};

export const updateShiftAssignment = async (shiftId: string, nurseId: string): Promise<void> => {
  await api.post(`/shifts/${shiftId}/assign`, { nurse_id: nurseId });
};

export const removeShiftAssignment = async (assignmentId: string): Promise<void> => {
  await api.delete(`/shifts/assignments/${assignmentId}`);
};

export const exportSchedule = async (
  scheduleId: string,
  format: 'excel' | 'csv'
): Promise<Blob> => {
  const endpoint =
    format === 'excel'
      ? `/schedules/${scheduleId}/export/excel`
      : `/schedules/${scheduleId}/export/csv`;

  const response = await api.get(endpoint, {
    responseType: 'blob'
  });

  return response.data;
};
