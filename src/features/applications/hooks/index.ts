import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsApi } from "../api";
import type {
  CreateApplicationRequest,
  UpdateApplicationRequest,
} from "../../../shared/types";

export const useApplications = () => {
  return useQuery({
    queryKey: ["applications"],
    queryFn: () => applicationsApi.getAll(),
  });
};

export const useApplication = (id: number) => {
  return useQuery({
    queryKey: ["applications", id],
    queryFn: () => applicationsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateApplicationRequest) => applicationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateApplicationRequest }) =>
      applicationsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications", variables.id] });
    },
  });
};

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => applicationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};
