import { useEffect, useState } from "react";
import { AppShell } from "./layouts/AppShell";
import { ApplicationUpdatePage } from "./pages/ApplicationUpdate/ApplicationUpdatePage";
import { LoginPage } from "./pages/Auth/LoginPage";
import { RegisterPage } from "./pages/Auth/RegisterPage";
import { HomePage } from "./pages/Home/HomePage";
import { MatchesManagementPage } from "./pages/Home/MatchesManagementPage";
import { PlayerExpenseManagementPage } from "./pages/Home/PlayerExpenseManagementPage";
import { SquadManagementPage } from "./pages/Home/SquadManagementPage";
import { TeamExpensesPage } from "./pages/Home/TeamExpensesPage";
import { AUTH_EVENTS, LOCAL_STORAGE_KEYS } from "./constants/app.constants";
import { ROUTES } from "./constants/routes";
import { useAppUpdate } from "./contexts/AppUpdateContext";
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
  const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
  const currentRoute = getCurrentRoute();
  const isAuthRoute = currentRoute === ROUTES.LOGIN || currentRoute === ROUTES.REGISTER;
  const startupRoute = !refreshToken ? ROUTES.LOGIN : isAuthRoute ? ROUTES.HOME : currentRoute;

  window.history.replaceState(null, "", startupRoute);

  return startupRoute;
};

const getAllowedRoute = (
  route: AppRoute,
  subscription: AuthSubscription | null,
  isUpdatePageRequired: boolean
): AppRoute => {
  if (isUpdatePageRequired && route !== ROUTES.APPLICATION_UPDATE) {
    return ROUTES.APPLICATION_UPDATE;
  }

  const isAuthRoute = route === ROUTES.LOGIN || route === ROUTES.REGISTER;

  if (
    isFreeSubscription(subscription) &&
    !isAuthRoute &&
    route !== ROUTES.HOME &&
    route !== ROUTES.APPLICATION_UPDATE
  ) {
    return ROUTES.HOME;
  }

  return route;
};

const App = (): JSX.Element => {
  const { isUpdatePageRequired, isUpdateBlocking } = useAppUpdate();
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getStartupRoute);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN))
  );
  const [subscription, setSubscription] = useState<AuthSubscription | null>(getStoredSubscription);

  useEffect(() => {
    const handleSessionExpired = (): void => {
      setSubscription(null);
      setIsAuthenticated(false);
      window.history.replaceState(null, "", ROUTES.LOGIN);
      setCurrentRoute(ROUTES.LOGIN);
    };

    window.addEventListener(AUTH_EVENTS.SESSION_EXPIRED, handleSessionExpired);

    return () => window.removeEventListener(AUTH_EVENTS.SESSION_EXPIRED, handleSessionExpired);
  }, []);

  useEffect(() => {
    const handlePopState = (): void => {
      const nextRoute = getAllowedRoute(getCurrentRoute(), subscription, isUpdatePageRequired);

      if (nextRoute !== window.location.pathname) {
        window.history.replaceState(null, "", nextRoute);
      }

      setCurrentRoute(nextRoute);
    };

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, [isUpdatePageRequired, subscription]);

  useEffect(() => {
    const nextRoute = getAllowedRoute(currentRoute, subscription, isUpdatePageRequired);

    if (nextRoute !== currentRoute) {
      window.history.replaceState(null, "", nextRoute);
      setCurrentRoute(nextRoute);
    }
  }, [currentRoute, isUpdatePageRequired, subscription]);

  useEffect(() => {
    if (
      currentRoute === ROUTES.APPLICATION_UPDATE &&
      !isUpdatePageRequired &&
      !isUpdateBlocking
    ) {
      const nextRoute = isAuthenticated ? ROUTES.HOME : ROUTES.LOGIN;

      window.history.replaceState(null, "", nextRoute);
      setCurrentRoute(nextRoute);
    }
  }, [currentRoute, isAuthenticated, isUpdateBlocking, isUpdatePageRequired]);

  const handleNavigate = (route: AppRoute): void => {
    const nextRoute = getAllowedRoute(route, subscription, isUpdatePageRequired);

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

    if (currentRoute === ROUTES.APPLICATION_UPDATE) {
      return <ApplicationUpdatePage />;
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

  if (currentRoute === ROUTES.APPLICATION_UPDATE || isUpdatePageRequired || isUpdateBlocking) {
    return <ApplicationUpdatePage />;
  }

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
