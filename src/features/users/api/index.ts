import { apiClient } from "../../../shared/lib/apiClient";
import type {
  User,
  UpdateUserRequest,
  ChangePasswordRequest,
} from "../../../shared/types";

export const usersApi = {
  getMe: async (): Promise<User> => {
    return apiClient.get<User>("/users/me");
  },

  updateMe: async (data: UpdateUserRequest): Promise<User> => {
    return apiClient.patch<User>("/users/me", data);
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    return apiClient.post<void>("/users/change-password", data);
  },

  uploadCV: async (file: File): Promise<{ file_path: string }> => {
    return apiClient.uploadFile<{ file_path: string }>(
      "/users/upload-cv",
      file,
      "file"
    );
  },

  debugCVExtraction: async (file: File): Promise<{ raw_text: string; text_length: number }> => {
    return apiClient.uploadFile<{ raw_text: string; text_length: number }>(
      "/users/debug-cv-extraction",
      file,
      "file"
    );
  },
};
