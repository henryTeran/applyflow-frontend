import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobMatchesApi } from "../api";

export const useJobMatch = (jobId: number) => {
  return useQuery({
    queryKey: ["jobMatches", jobId],
    queryFn: () => jobMatchesApi.getByJobId(jobId),
    enabled: !!jobId,
    retry: false,
  });
};

export const useAnalyzeJobMatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: number) => jobMatchesApi.analyze(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["jobMatches", jobId] });
    },
  });
};
