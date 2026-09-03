export type MatchSlotStatus = "GROUND_BOOKED" | "SLOT_BOOKED";
export type MatchSlotPayloadStatus = MatchSlotStatus;

export type MatchPaymentStatus = "PENDING" | "PAID" | "RECEIVED";
export type MatchPaymentPayloadStatus = "PENDING" | "PAID";

export type MatchStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface Match {
  id: number;
  my_team_id: number;
  my_team_name: string;
  opponent_team_name: string;
  match_date: string;
  match_time: string;
  ground_name: string;
  opponent_captain_name: string;
  opponent_captain_number: string;
  slot_status: MatchSlotPayloadStatus;
  match_fees: number;
  payment_status: MatchPaymentStatus;
  match_status: MatchStatus;
}

export interface SettledMatch extends Match {
  ball_fees: number | null;
  total_expense: number | null;
  total_player_count: number | null;
  per_head_expense: number | null;
  completed_at: string | null;
  cancelled_at: string | null;
}

export interface MatchPayload {
  my_team_id: number;
  opponent_team_name: string;
  match_date: string;
  match_time: string;
  ground_name: string;
  opponent_captain_name: string;
  opponent_captain_number: string;
  slot_status: MatchSlotStatus;
  match_fees: number;
  payment_status: MatchPaymentPayloadStatus;
}

export interface CompleteMatchPayload {
  ball_fees: number;
  total_player_count: number;
  player_ids: number[];
}

export interface CompleteMatchResult {
  match_fees: number;
  ball_fees: number;
  total_expense: number;
  total_player_count: number;
  per_head_expense: number;
}
