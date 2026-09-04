import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from "axios";
import { AUTH_EVENTS, LOCAL_STORAGE_KEYS } from "../constants/app.constants";
import { ENV } from "../constants/env";
import { API_ENDPOINTS } from "./apiEndpoints";
import type { RefreshTokenPayload, RefreshTokenResponse } from "../types/auth";

interface RetriableAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const authFreeEndpoints = new Set<string>([
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.REGISTER,
  API_ENDPOINTS.AUTH.REFRESH_TOKEN
]);

let refreshTokenRequest: Promise<string> | null = null;

export const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

const refreshClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

const clearStoredAuth = (): void => {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_USER);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.SUBSCRIPTION);
};

const notifySessionExpired = (): void => {
  window.dispatchEvent(new Event(AUTH_EVENTS.SESSION_EXPIRED));
};

const isAuthFreeRequest = (url?: string): boolean => {
  if (!url) {
    return false;
  }

  return authFreeEndpoints.has(url);
};

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);

  if (!refreshToken) {
    throw new Error("Refresh token is missing.");
  }

  const response = await refreshClient.post<
    RefreshTokenResponse,
    AxiosResponse<RefreshTokenResponse>,
    RefreshTokenPayload
  >(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken });

  if (!response.data.success || !response.data.accessToken) {
    throw new Error("Unable to refresh access token.");
  }

  localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
  localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);

  return response.data.accessToken;
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const accessToken = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetriableAxiosRequestConfig | undefined;
    const shouldRefresh =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthFreeRequest(originalRequest.url);

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshTokenRequest ??= refreshAccessToken().finally(() => {
        refreshTokenRequest = null;
      });

      const accessToken = await refreshTokenRequest;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      clearStoredAuth();
      notifySessionExpired();

      return Promise.reject(refreshError);
    }
  }
);

export const api = {
  get: <TResponse>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<TResponse>> =>
    apiClient.get<TResponse>(url, config),

  post: <TResponse, TPayload = unknown>(
    url: string,
    data?: TPayload,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<TResponse>> => apiClient.post<TResponse>(url, data, config),

  put: <TResponse, TPayload = unknown>(
    url: string,
    data?: TPayload,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<TResponse>> => apiClient.put<TResponse>(url, data, config),

  patch: <TResponse, TPayload = unknown>(
    url: string,
    data?: TPayload,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<TResponse>> => apiClient.patch<TResponse>(url, data, config),

  delete: <TResponse>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<TResponse>> => apiClient.delete<TResponse>(url, config)
};
