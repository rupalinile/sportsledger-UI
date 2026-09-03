import { useEffect, useState } from "react";
import { AppShell } from "./layouts/AppShell";
import { LoginPage } from "./pages/Auth/LoginPage";
import { RegisterPage } from "./pages/Auth/RegisterPage";
import { HomePage } from "./pages/Home/HomePage";
import { MatchesManagementPage } from "./pages/Home/MatchesManagementPage";
import { PlayerExpenseManagementPage } from "./pages/Home/PlayerExpenseManagementPage";
import { SquadManagementPage } from "./pages/Home/SquadManagementPage";
import { TeamExpensesPage } from "./pages/Home/TeamExpensesPage";
import { LOCAL_STORAGE_KEYS } from "./constants/app.constants";
import { ROUTES } from "./constants/routes";
import type { AuthSubscription } from "./types/auth";
import type { AppRoute } from "./types/navigation";
import { isAppRoute } from "./utils/navigation";
import { getStoredSubscription, isFreeSubscription } from "./utils/subscription";

const getCurrentRoute = (): AppRoute => {
  const route = window.location.pathname;

  return isAppRoute(route) ? route : ROUTES.LOGIN;
};

const clearStoredAuth = (): void => {
  localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_USER);
  localStorage.removeItem(LOCAL_STORAGE_KEYS.SUBSCRIPTION);
};

const getStartupRoute = (): AppRoute => {
  clearStoredAuth();
  window.history.replaceState(null, "", ROUTES.LOGIN);

  return ROUTES.LOGIN;
};

const getAllowedRoute = (route: AppRoute, subscription: AuthSubscription | null): AppRoute => {
  const isAuthRoute = route === ROUTES.LOGIN || route === ROUTES.REGISTER;

  if (isFreeSubscription(subscription) && !isAuthRoute && route !== ROUTES.HOME) {
    return ROUTES.HOME;
  }

  return route;
};

const App = (): JSX.Element => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getStartupRoute);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [subscription, setSubscription] = useState<AuthSubscription | null>(null);

  useEffect(() => {
    const handlePopState = (): void => {
      const nextRoute = getAllowedRoute(getCurrentRoute(), subscription);

      if (nextRoute !== window.location.pathname) {
        window.history.replaceState(null, "", nextRoute);
      }

      setCurrentRoute(nextRoute);
    };

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, [subscription]);

  const handleNavigate = (route: AppRoute): void => {
    const nextRoute = getAllowedRoute(route, subscription);

    window.history.pushState(null, "", nextRoute);
    setCurrentRoute(nextRoute);
  };

  const handleLoginComplete = (): void => {
    setSubscription(getStoredSubscription());
    setIsAuthenticated(true);
    handleNavigate(ROUTES.HOME);
  };

  const handleLogout = (): void => {
    clearStoredAuth();
    setSubscription(null);
    setIsAuthenticated(false);
    handleNavigate(ROUTES.LOGIN);
  };

  const renderPage = (): JSX.Element => {
    if (currentRoute === ROUTES.LOGIN) {
      return <LoginPage onNavigate={handleNavigate} onLoginComplete={handleLoginComplete} />;
    }

    if (currentRoute === ROUTES.REGISTER) {
      return <RegisterPage onNavigate={handleNavigate} />;
    }

    if (currentRoute === ROUTES.HOME) {
      return <HomePage onNavigate={handleNavigate} />;
    }

    if (currentRoute === ROUTES.MATCHES) {
      return <MatchesManagementPage />;
    }

    if (currentRoute === ROUTES.SQUAD) {
      return <SquadManagementPage />;
    }

    if (currentRoute === ROUTES.PLAYER_EXPENSES) {
      return <PlayerExpenseManagementPage />;
    }

    if (currentRoute === ROUTES.TEAM_EXPENSES) {
      return <TeamExpensesPage />;
    }

    return <HomePage onNavigate={handleNavigate} />;
  };

  if (currentRoute === ROUTES.LOGIN) {
    return <LoginPage onNavigate={handleNavigate} onLoginComplete={handleLoginComplete} />;
  }

  if (currentRoute === ROUTES.REGISTER) {
    return renderPage();
  }

  if (!isAuthenticated) {
    return <LoginPage onNavigate={handleNavigate} onLoginComplete={handleLoginComplete} />;
  }

  return (
    <AppShell
      currentRoute={currentRoute}
      isFreePlan={isFreeSubscription(subscription)}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {renderPage()}
    </AppShell>
  );
};

export default App;
