import { apiClient } from "../../../shared/lib/apiClient";
import type {
  JobOffer,
  CreateJobOfferRequest,
  UpdateJobOfferRequest,
} from "../../../shared/types";

export const jobOffersApi = {
  getAll: async (userId?: number): Promise<JobOffer[]> => {
    const params = userId ? `?user_id=${userId}` : '';
    return apiClient.get<JobOffer[]>(`/job-offers/${params}`);
  },

  getById: async (id: number): Promise<JobOffer> => {
    return apiClient.get<JobOffer>(`/job-offers/${id}`);
  },

  create: async (data: CreateJobOfferRequest): Promise<JobOffer> => {
    return apiClient.post<JobOffer>("/job-offers/", data);
  },

  update: async (id: number, data: UpdateJobOfferRequest): Promise<JobOffer> => {
    return apiClient.put<JobOffer>(`/job-offers/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/job-offers/${id}`);
  },
};
