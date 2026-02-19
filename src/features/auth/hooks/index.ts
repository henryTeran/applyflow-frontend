import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api";
import { apiClient } from "../../../shared/lib/apiClient";
import type { LoginRequest, RegisterRequest } from "../../../shared/types";

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      apiClient.setToken(data.access_token);
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return () => {
    authApi.logout();
    queryClient.clear();
    window.location.href = "/login";
  };
};

export const useAuth = () => {
  const isAuthenticated = apiClient.hasToken();
  const logout = useLogout();

  return {
    isAuthenticated,
    logout,
  };
};
