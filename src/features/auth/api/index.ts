import { apiClient } from "../../../shared/lib/apiClient";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from "../../../shared/types";

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    // FastAPI OAuth2PasswordRequestForm expects form-data with username field
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);
    
    return apiClient.post<LoginResponse>("/auth/login", formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },

  register: async (data: RegisterRequest): Promise<User> => {
    return apiClient.post<User>("/auth/register", data);
  },

  logout: () => {
    apiClient.clearToken();
  },
};
