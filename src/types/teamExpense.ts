export type TeamExpenseApiCategory = "EXPENSE" | "DEPOSITE" | "DEPOSITED";

export interface TeamExpenseSummaryTotals {
  totalDepositedAmount?: number;
  totalDeposited?: number;
  total_deposited_amount?: number;
  total_deposited?: number;
  otherAmount?: number;
  other_amount?: number;
  totalTeamBalance?: number;
  total_team_balance?: number;
}

export interface TeamExpenseSummary extends TeamExpenseSummaryTotals {
  summary?: TeamExpenseSummaryTotals;
}

export interface TeamExpenseTransaction {
  id: number;
  teamId?: number;
  team_id?: number;
  teamName?: string;
  team_name?: string;
  category: TeamExpenseApiCategory;
  transactionDate?: string;
  transaction_date?: string;
  amount: number;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamExpenseTransactionPayload {
  teamId: number;
  category: "EXPENSE" | "DEPOSITED";
  transactionDate: string;
  amount: number;
  description: string;
}
