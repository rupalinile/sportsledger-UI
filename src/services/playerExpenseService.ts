import { API_ENDPOINTS } from "./apiEndpoints";
import { api } from "./api";
import type { ApiSuccessResponse } from "../types/dashboard";
import type {
  PlayerDeposit,
  PlayerDepositPayload,
  PlayerExpenseSummary
} from "../types/playerExpense";

export const playerExpenseService = {
  getSummary: async (): Promise<ApiSuccessResponse<PlayerExpenseSummary>> => {
    const response = await api.get<ApiSuccessResponse<PlayerExpenseSummary>>(
      API_ENDPOINTS.PLAYER_EXPENSES.SUMMARY
    );

    return response.data;
  },

  getDeposits: async (): Promise<ApiSuccessResponse<PlayerDeposit[]>> => {
    const response = await api.get<ApiSuccessResponse<PlayerDeposit[]>>(
      API_ENDPOINTS.PLAYER_DEPOSITS.BASE
    );

    return response.data;
  },

  addDeposit: async (
    payload: PlayerDepositPayload
  ): Promise<ApiSuccessResponse<PlayerDeposit>> => {
    const response = await api.post<ApiSuccessResponse<PlayerDeposit>, PlayerDepositPayload>(
      API_ENDPOINTS.PLAYER_DEPOSITS.BASE,
      payload
    );

    return response.data;
  },

  updateDeposit: async (
    depositId: number,
    payload: PlayerDepositPayload
  ): Promise<ApiSuccessResponse<PlayerDeposit>> => {
    const response = await api.post<ApiSuccessResponse<PlayerDeposit>, PlayerDepositPayload>(
      API_ENDPOINTS.PLAYER_DEPOSITS.BY_ID(depositId),
      payload
    );

    return response.data;
  },

  deleteDeposit: async (depositId: number): Promise<ApiSuccessResponse<null>> => {
    const response = await api.delete<ApiSuccessResponse<null>>(
      API_ENDPOINTS.PLAYER_DEPOSITS.BY_ID(depositId)
    );

    return response.data;
  }
};
