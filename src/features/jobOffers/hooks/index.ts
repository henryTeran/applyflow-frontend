import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobOffersApi } from "../api";
import type { CreateJobOfferRequest, UpdateJobOfferRequest } from "../../../shared/types";

export const useJobOffers = () => {
  return useQuery({
    queryKey: ["jobOffers"],
    queryFn: () => jobOffersApi.getAll(),
  });
};

export const useJobOffer = (id: number) => {
  return useQuery({
    queryKey: ["jobOffers", id],
    queryFn: () => jobOffersApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateJobOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJobOfferRequest) => jobOffersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobOffers"] });
    },
  });
};

export const useUpdateJobOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateJobOfferRequest }) =>
      jobOffersApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["jobOffers"] });
      queryClient.invalidateQueries({ queryKey: ["jobOffers", variables.id] });
    },
  });
};

export const useDeleteJobOffer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => jobOffersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobOffers"] });
    },
  });
};
