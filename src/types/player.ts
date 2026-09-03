export interface Player {
  id: number;
  player_name: string;
  mobile_number: string;
  team_id: number;
  team_name: string | null;
  is_active: number;
}

export interface PlayerPayload {
  player_name: string;
  mobile_number: string;
  team_id: number;
}

export interface PlayerFilters {
  teamId?: number;
}
