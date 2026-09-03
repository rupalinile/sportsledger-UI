import { API_ENDPOINTS } from "./apiEndpoints";
import { api } from "./api";
import type { ApiSuccessResponse } from "../types/dashboard";
import type {
  CompleteMatchPayload,
  CompleteMatchResult,
  Match,
  MatchPayload,
  SettledMatch
} from "../types/match";

export const matchService = {
  getScheduledMatches: async (): Promise<ApiSuccessResponse<Match[]>> => {
    const response = await api.get<ApiSuccessResponse<Match[]>>(API_ENDPOINTS.MATCHES.SCHEDULED);

    return response.data;
  },

  getSettledMatches: async (): Promise<ApiSuccessResponse<SettledMatch[]>> => {
    const response = await api.get<ApiSuccessResponse<SettledMatch[]>>(
      API_ENDPOINTS.MATCHES.SETTLED
    );

    return response.data;
  },

  getMatch: async (matchId: number): Promise<ApiSuccessResponse<Match>> => {
    const response = await api.get<ApiSuccessResponse<Match>>(API_ENDPOINTS.MATCHES.BY_ID(matchId));

    return response.data;
  },

  addMatch: async (payload: MatchPayload): Promise<ApiSuccessResponse<{ match_id: number }>> => {
    const response = await api.post<ApiSuccessResponse<{ match_id: number }>, MatchPayload>(
      API_ENDPOINTS.MATCHES.BASE,
      payload
    );

    return response.data;
  },

  updateMatch: async (
    matchId: number,
    payload: MatchPayload
  ): Promise<ApiSuccessResponse<Match>> => {
    const response = await api.put<ApiSuccessResponse<Match>, MatchPayload>(
      API_ENDPOINTS.MATCHES.BY_ID(matchId),
      payload
    );

    return response.data;
  },

  cancelMatch: async (matchId: number): Promise<ApiSuccessResponse<Match>> => {
    const response = await api.patch<ApiSuccessResponse<Match>>(
      API_ENDPOINTS.MATCHES.CANCEL(matchId)
    );

    return response.data;
  },

  completeMatch: async (
    matchId: number,
    payload: CompleteMatchPayload
  ): Promise<ApiSuccessResponse<CompleteMatchResult>> => {
    const response = await api.patch<ApiSuccessResponse<CompleteMatchResult>, CompleteMatchPayload>(
      API_ENDPOINTS.MATCHES.COMPLETE(matchId),
      payload
    );

    return response.data;
  }
};
