import axios from "axios";

interface ApiErrorResponse {
  message?: string;
  error?: string;
}

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage = "Something went wrong. Please try again."
): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message ?? error.response?.data?.error ?? fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
};
