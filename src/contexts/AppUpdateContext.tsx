import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { APP_UPDATE_CONFIG } from "../constants/app.constants";
import { appUpdateService } from "../services/appUpdateService";
import type { AppUpdateState } from "../types/appUpdate";

interface AppUpdateContextValue extends AppUpdateState {
  isUpdateBlocking: boolean;
  isUpdatePageRequired: boolean;
  checkForUpdates: () => Promise<void>;
  openDownload: () => Promise<void>;
}

const initialState: AppUpdateState = {
  status: "idle",
  installedVersion: null,
  updateInfo: null,
  errorMessage: null
};

const AppUpdateContext = createContext<AppUpdateContextValue | null>(null);

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to check for application updates.";
};

export const AppUpdateProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [state, setState] = useState<AppUpdateState>(initialState);
  const hasCheckedOnStartupRef = useRef(false);

  const checkForUpdates = useCallback(async (): Promise<void> => {
    setState((previousState) => ({
      ...previousState,
      status: "loading",
      errorMessage: null
    }));

    try {
      const installedVersion = await appUpdateService.getInstalledVersion();
      const versionResponse = await appUpdateService.checkVersion({
        currentVersion: installedVersion,
        platform: APP_UPDATE_CONFIG.PLATFORM
      });

      setState({
        status: "success",
        installedVersion,
        updateInfo: versionResponse.data,
        errorMessage: null
      });
    } catch (error) {
      setState((previousState) => ({
        ...previousState,
        status: "error",
        errorMessage: getErrorMessage(error)
      }));
    }
  }, []);

  useEffect(() => {
    if (hasCheckedOnStartupRef.current) {
      return;
    }

    hasCheckedOnStartupRef.current = true;
    void checkForUpdates();
  }, [checkForUpdates]);

  const openDownload = useCallback(async (): Promise<void> => {
    if (!state.updateInfo?.downloadUrl) {
      throw new Error("No update download URL is available.");
    }

    await appUpdateService.openDownloadUrl(state.updateInfo.downloadUrl);
  }, [state.updateInfo]);

  const isUpdateAvailable = state.updateInfo?.updateAvailable === true;
  const isUpdateBlocking = state.status !== "success" || isUpdateAvailable;
  const isUpdatePageRequired = state.status !== "success" || isUpdateAvailable;

  const value = useMemo<AppUpdateContextValue>(
    () => ({
      ...state,
      isUpdateBlocking,
      isUpdatePageRequired,
      checkForUpdates,
      openDownload
    }),
    [checkForUpdates, isUpdateBlocking, isUpdatePageRequired, openDownload, state]
  );

  return <AppUpdateContext.Provider value={value}>{children}</AppUpdateContext.Provider>;
};

export const useAppUpdate = (): AppUpdateContextValue => {
  const context = useContext(AppUpdateContext);

  if (!context) {
    throw new Error("useAppUpdate must be used within AppUpdateProvider.");
  }

  return context;
};
