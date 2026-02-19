import { apiClient } from "../../../shared/lib/apiClient";
import type {
  Application,
  CreateApplicationRequest,
  UpdateApplicationRequest,
} from "../../../shared/types";

export const applicationsApi = {
  getAll: async (): Promise<Application[]> => {
    return apiClient.get<Application[]>("/applications/");
  },

  getById: async (id: number): Promise<Application> => {
    return apiClient.get<Application>(`/applications/${id}`);
  },

  create: async (data: CreateApplicationRequest): Promise<Application> => {
    return apiClient.post<Application>("/applications/", data);
  },

  update: async (
    id: number,
    data: UpdateApplicationRequest
  ): Promise<Application> => {
    return apiClient.put<Application>(`/applications/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/applications/${id}`);
  },
};
