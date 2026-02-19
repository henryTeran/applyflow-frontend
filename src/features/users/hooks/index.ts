import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../api";
import type { UpdateUserRequest, ChangePasswordRequest } from "../../../shared/types";

export const useUser = () => {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: () => usersApi.getMe(),
    retry: false,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserRequest) => usersApi.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => usersApi.changePassword(data),
  });
};
