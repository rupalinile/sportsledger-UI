export interface PlayerDeposit {
  id: number;
  player_id: number;
  player_name: string;
  deposit_date: string;
  amount: number;
  notes: string | null;
}

export interface PlayerDepositPayload {
  player_id: number;
  deposit_date: string;
  amount: number;
  notes?: string;
}

export interface MatchExpenseSummary {
  match_id: number;
  match_date: string;
  opponent_team_name: string;
}

export interface PlayerMatchExpense {
  match_id: number;
  amount: number | null;
}

export interface PlayerExpenseSummaryRow {
  player_id: number;
  player_name: string;
  total_deposit: number;
  total_match_expense: number;
  remaining_balance: number;
  match_expenses: PlayerMatchExpense[];
}

export interface PlayerExpenseTotals {
  total_deposited: number;
  total_match_expense: number;
  remaining_balance: number;
}

export interface PlayerExpenseSummary {
  summary: PlayerExpenseTotals;
  matches: MatchExpenseSummary[];
  players: PlayerExpenseSummaryRow[];
}
