export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register"
  },
  TEAMS: {
    BASE: "/teams",
    BY_ID: (teamId: number) => `/teams/${teamId}`
  },
  PLAYERS: {
    BASE: "/players",
    BY_ID: (playerId: number) => `/players/${playerId}`
  },
  MATCHES: {
    BASE: "/matches",
    SCHEDULED: "/matches/scheduled",
    SETTLED: "/matches/settled",
    BY_ID: (matchId: number) => `/matches/${matchId}`,
    CANCEL: (matchId: number) => `/matches/${matchId}/cancel`,
    COMPLETE: (matchId: number) => `/matches/${matchId}/complete`
  },
  PLAYER_DEPOSITS: {
    BASE: "/player-deposits",
    BY_ID: (depositId: number) => `/player-deposits/${depositId}`
  },
  PLAYER_EXPENSES: {
    SUMMARY: "/player-expenses/summary",
    BY_PLAYER_ID: (playerId: number) => `/player-expenses/${playerId}`
  },
  TEAM_EXPENSES: {
    SUMMARY_ALL: "/team-expenses/summary",
    SUMMARY: (teamId: number) => `/team-expenses/summary/${teamId}`,
    TRANSACTIONS: (teamId: number) => `/team-expenses/transactions/${teamId}`,
    TRANSACTION_DETAIL: (transactionId: number) =>
      `/team-expenses/transactions/detail/${transactionId}`,
    TRANSACTION_BY_ID: (transactionId: number) => `/team-expenses/transactions/${transactionId}`,
    TRANSACTIONS_BASE: "/team-expenses/transactions"
  },
  DASHBOARD: {
    SUMMARY: "/dashboard/summary"
  },
  APP: {
    VERSION_CHECK: "/app/version-check"
  }
} as const;
