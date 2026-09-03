import { ROUTES, ROUTE_LABELS } from "../constants/routes";
import type { NavigationItem } from "../types/navigation";

export const getNavigationItems = (): NavigationItem[] => [
  {
    key: ROUTES.HOME,
    label: ROUTE_LABELS[ROUTES.HOME]
  },
  {
    key: ROUTES.MATCHES,
    label: ROUTE_LABELS[ROUTES.MATCHES]
  },
  {
    key: ROUTES.SQUAD,
    label: ROUTE_LABELS[ROUTES.SQUAD]
  },
  {
    key: ROUTES.PLAYER_EXPENSES,
    label: ROUTE_LABELS[ROUTES.PLAYER_EXPENSES]
  },
  {
    key: ROUTES.TEAM_EXPENSES,
    label: ROUTE_LABELS[ROUTES.TEAM_EXPENSES]
  }
];

export const isAppRoute = (route: string): route is NavigationItem["key"] =>
  Object.values(ROUTES).includes(route as NavigationItem["key"]);
