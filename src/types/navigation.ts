import type { ROUTES } from "../constants/routes";

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

export interface NavigationItem {
  key: AppRoute;
  label: string;
}

export interface AppRouteProps {
  onNavigate: (route: AppRoute) => void;
}
