import { API_ENDPOINTS } from "./apiEndpoints";
import { api } from "./api";
import type { ApiSuccessResponse, DashboardSummary } from "../types/dashboard";

export const dashboardService = {
  getSummary: async (): Promise<ApiSuccessResponse<DashboardSummary>> => {
    const response = await api.get<ApiSuccessResponse<DashboardSummary>>(
      API_ENDPOINTS.DASHBOARD.SUMMARY
    );

    return response.data;
  }
};
