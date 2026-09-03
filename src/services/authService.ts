import { API_ENDPOINTS } from "./apiEndpoints";
import { api } from "./api";
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse
} from "../types/auth";

export const authService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse, LoginPayload>(
      API_ENDPOINTS.AUTH.LOGIN,
      payload
    );

    return response.data;
  },

  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse, RegisterPayload>(
      API_ENDPOINTS.AUTH.REGISTER,
      payload
    );

    return response.data;
  }
};
