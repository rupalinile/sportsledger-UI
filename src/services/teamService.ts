import { API_ENDPOINTS } from "./apiEndpoints";
import { api } from "./api";
import type { ApiSuccessResponse, Team, TeamPayload } from "../types/dashboard";

export const teamService = {
  getTeams: async (): Promise<ApiSuccessResponse<Team[]>> => {
    const response = await api.get<ApiSuccessResponse<Team[]>>(API_ENDPOINTS.TEAMS.BASE);

    return response.data;
  },

  addTeam: async (payload: TeamPayload): Promise<ApiSuccessResponse<Team>> => {
    const response = await api.post<ApiSuccessResponse<Team>, TeamPayload>(
      API_ENDPOINTS.TEAMS.BASE,
      payload
    );

    return response.data;
  },

  updateTeam: async (
    teamId: number,
    payload: TeamPayload
  ): Promise<ApiSuccessResponse<Team>> => {
    const response = await api.put<ApiSuccessResponse<Team>, TeamPayload>(
      API_ENDPOINTS.TEAMS.BY_ID(teamId),
      payload
    );

    return response.data;
  }
};
