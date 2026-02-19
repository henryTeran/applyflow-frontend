import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { draftsApi } from "../api";
import type { UpdateDraftRequest } from "../../../shared/types";

export const useDraft = (jobId: number) => {
  return useQuery({
    queryKey: ["drafts", jobId],
    queryFn: () => draftsApi.getByJobId(jobId),
    enabled: !!jobId,
    retry: false,
  });
};

export const useGenerateDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: number) => draftsApi.generate(jobId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["drafts", data.job_offer_id] });
    },
  });
};

export const useUpdateDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDraftRequest }) =>
      draftsApi.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["drafts", data.job_offer_id] });
    },
  });
};

export const useDeleteDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => draftsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
    },
  });
};

export const useSendDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => draftsApi.send(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};
