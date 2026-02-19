import { apiClient } from "../../../shared/lib/apiClient";
import type { TimelineEvent, CreateTimelineEventRequest } from "../../../shared/types";

export const timelineApi = {
  getByApplicationId: async (applicationId: number): Promise<TimelineEvent[]> => {
    return apiClient.get<TimelineEvent[]>(`/timeline/${applicationId}`);
  },

  create: async (
    applicationId: number,
    data: Omit<CreateTimelineEventRequest, "application_id">
  ): Promise<TimelineEvent> => {
    return apiClient.post<TimelineEvent>(`/timeline/${applicationId}`, data);
  },
};
