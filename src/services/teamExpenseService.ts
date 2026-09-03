import { API_ENDPOINTS } from "./apiEndpoints";
import { api } from "./api";
import type { ApiSuccessResponse } from "../types/dashboard";
import type {
  TeamExpenseSummary,
  TeamExpenseTransaction,
  TeamExpenseTransactionPayload
} from "../types/teamExpense";

export const teamExpenseService = {
  getSummary: async (teamId: number): Promise<ApiSuccessResponse<TeamExpenseSummary>> => {
    const response = await api.get<ApiSuccessResponse<TeamExpenseSummary>>(
      API_ENDPOINTS.TEAM_EXPENSES.SUMMARY(teamId)
    );

    return response.data;
  },

  getTransactions: async (
    teamId: number
  ): Promise<ApiSuccessResponse<TeamExpenseTransaction[]>> => {
    const response = await api.get<ApiSuccessResponse<TeamExpenseTransaction[]>>(
      API_ENDPOINTS.TEAM_EXPENSES.TRANSACTIONS(teamId)
    );

    return response.data;
  },

  getTransaction: async (
    transactionId: number
  ): Promise<ApiSuccessResponse<TeamExpenseTransaction>> => {
    const response = await api.get<ApiSuccessResponse<TeamExpenseTransaction>>(
      API_ENDPOINTS.TEAM_EXPENSES.TRANSACTION_DETAIL(transactionId)
    );

    return response.data;
  },

  addTransaction: async (
    payload: TeamExpenseTransactionPayload
  ): Promise<ApiSuccessResponse<TeamExpenseTransaction>> => {
    const response = await api.post<
      ApiSuccessResponse<TeamExpenseTransaction>,
      TeamExpenseTransactionPayload
    >(API_ENDPOINTS.TEAM_EXPENSES.TRANSACTIONS_BASE, payload);

    return response.data;
  },

  updateTransaction: async (
    transactionId: number,
    payload: TeamExpenseTransactionPayload
  ): Promise<ApiSuccessResponse<TeamExpenseTransaction>> => {
    const response = await api.put<
      ApiSuccessResponse<TeamExpenseTransaction>,
      TeamExpenseTransactionPayload
    >(API_ENDPOINTS.TEAM_EXPENSES.TRANSACTION_BY_ID(transactionId), payload);

    return response.data;
  },

  deleteTransaction: async (transactionId: number): Promise<ApiSuccessResponse<null>> => {
    const response = await api.delete<ApiSuccessResponse<null>>(
      API_ENDPOINTS.TEAM_EXPENSES.TRANSACTION_BY_ID(transactionId)
    );

    return response.data;
  }
};
