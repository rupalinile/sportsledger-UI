export interface Team {
  id: number;
  teamName: string;
}

export interface ApiSuccessResponse<TData> {
  success: boolean;
  message?: string;
  data: TData;
}

export interface TeamPayload {
  teamName: string;
}

export interface TeamWiseSummary {
  team_id: number;
  team_name: string;
  total_team_balance: number;
  total_squad_count: number;
  total_matches_scheduled: number;
}

export interface OverallSummary {
  total_team_balance: number;
  total_squad_count: number;
  total_matches_scheduled: number;
}

export interface DashboardSummary {
  team_wise_summary: TeamWiseSummary[];
  overall_summary: OverallSummary;
}
