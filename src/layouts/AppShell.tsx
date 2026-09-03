import { Layout } from "antd";
import type { PropsWithChildren } from "react";
import { AppContent } from "../components/layout/AppContent";
import { AppHeader } from "../components/layout/AppHeader";
import { AppSidebar } from "../components/layout/AppSidebar";
import type { AppRoute } from "../types/navigation";

interface AppShellProps extends PropsWithChildren {
  currentRoute: AppRoute;
  isFreePlan: boolean;
  onNavigate: (route: AppRoute) => void;
  onLogout: () => void;
}

export const AppShell = ({
  children,
  currentRoute,
  isFreePlan,
  onNavigate,
  onLogout
}: AppShellProps): JSX.Element => (
  <Layout className="app-shell">
    <AppSidebar currentRoute={currentRoute} isFreePlan={isFreePlan} onNavigate={onNavigate} />
    <Layout>
      <AppHeader onLogout={onLogout} />
      <AppContent>{children}</AppContent>
    </Layout>
  </Layout>
);
