import { apiClient } from "../../../shared/lib/apiClient";
import type { ApplicationDraft, UpdateDraftRequest } from "../../../shared/types";

export const draftsApi = {
  generate: async (jobId: number): Promise<ApplicationDraft> => {
    return apiClient.post<ApplicationDraft>(`/drafts/generate/${jobId}`);
  },

  getByJobId: async (jobId: number): Promise<ApplicationDraft> => {
    return apiClient.get<ApplicationDraft>(`/drafts/by-job/${jobId}`);
  },

  update: async (
    draftId: number,
    data: UpdateDraftRequest
  ): Promise<ApplicationDraft> => {
    return apiClient.put<ApplicationDraft>(`/drafts/${draftId}`, data);
  },

  delete: async (draftId: number): Promise<void> => {
    return apiClient.delete<void>(`/drafts/${draftId}`);
  },

  send: async (draftId: number): Promise<void> => {
    return apiClient.post<void>(`/drafts/${draftId}/send`);
  },
};
