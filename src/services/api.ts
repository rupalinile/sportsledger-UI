import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from "axios";
import { LOCAL_STORAGE_KEYS } from "../constants/app.constants";
import { ENV } from "../constants/env";

export const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const accessToken = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
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
