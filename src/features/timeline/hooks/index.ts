import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { timelineApi } from "../api";
import type { CreateTimelineEventRequest } from "../../../shared/types";

export const useTimeline = (applicationId: number) => {
  return useQuery({
    queryKey: ["timeline", applicationId],
    queryFn: () => timelineApi.getByApplicationId(applicationId),
    enabled: !!applicationId,
  });
};

export const useCreateTimelineEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      applicationId,
      data,
    }: {
      applicationId: number;
      data: Omit<CreateTimelineEventRequest, "application_id">;
    }) => timelineApi.create(applicationId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["timeline", data.application_id],
      });
    },
  });
};
