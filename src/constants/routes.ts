export const ROUTES = {
  HOME: "/",
  MATCHES: "/matches",
  SQUAD: "/squad",
  PLAYER_EXPENSES: "/player-expenses",
  TEAM_EXPENSES: "/team-expenses",
  PLAYER_REPORTS: "/player-reports",
  ABOUT: "/about",
  APPLICATION_UPDATE: "/application-update",
  LOGIN: "/login",
  REGISTER: "/register"
} as const;

export const ROUTE_LABELS = {
  [ROUTES.HOME]: "Dashboard",
  [ROUTES.MATCHES]: "Matches Management",
  [ROUTES.SQUAD]: "Squad Management",
  [ROUTES.PLAYER_EXPENSES]: "Player Expense Management",
  [ROUTES.TEAM_EXPENSES]: "Team Expenses",
  [ROUTES.PLAYER_REPORTS]: "View Player Reports",
  [ROUTES.ABOUT]: "About Us",
  [ROUTES.APPLICATION_UPDATE]: "Application Update",
  [ROUTES.LOGIN]: "Login",
  [ROUTES.REGISTER]: "Registration"
} as const;
