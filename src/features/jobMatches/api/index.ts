import { apiClient } from "../../../shared/lib/apiClient";
import type { JobMatch } from "../../../shared/types";

export const jobMatchesApi = {
  analyze: async (jobId: number): Promise<JobMatch> => {
    return apiClient.post<JobMatch>(`/job-matches/analyze/${jobId}`);
  },

  getByJobId: async (jobId: number): Promise<JobMatch> => {
    return apiClient.get<JobMatch>(`/job-matches/${jobId}`);
  },
};
