import { API_ENDPOINTS } from "./apiEndpoints";
import { api } from "./api";
import type { ApiSuccessResponse } from "../types/dashboard";
import type { Player, PlayerFilters, PlayerPayload } from "../types/player";

export const playerService = {
  getPlayers: async (filters?: PlayerFilters): Promise<ApiSuccessResponse<Player[]>> => {
    const response = await api.get<ApiSuccessResponse<Player[]>>(API_ENDPOINTS.PLAYERS.BASE, {
      params: filters?.teamId !== undefined ? { team_id: filters.teamId } : undefined
    });

    return response.data;
  },

  getPlayer: async (playerId: number): Promise<ApiSuccessResponse<Player>> => {
    const response = await api.get<ApiSuccessResponse<Player>>(
      API_ENDPOINTS.PLAYERS.BY_ID(playerId)
    );

    return response.data;
  },

  addPlayer: async (payload: PlayerPayload): Promise<ApiSuccessResponse<Player>> => {
    const response = await api.post<ApiSuccessResponse<Player>, PlayerPayload>(
      API_ENDPOINTS.PLAYERS.BASE,
      payload
    );

    return response.data;
  },

  addPlayers: async (payload: PlayerPayload[]): Promise<ApiSuccessResponse<Player[]>> => {
    const response = await api.post<ApiSuccessResponse<Player[]>, PlayerPayload[]>(
      API_ENDPOINTS.PLAYERS.BASE,
      payload
    );

    return response.data;
  },

  updatePlayer: async (
    playerId: number,
    payload: PlayerPayload
  ): Promise<ApiSuccessResponse<Player>> => {
    const response = await api.put<ApiSuccessResponse<Player>, PlayerPayload>(
      API_ENDPOINTS.PLAYERS.BY_ID(playerId),
      payload
    );

    return response.data;
  }
};
