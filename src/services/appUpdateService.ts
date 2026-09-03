import { APP_UPDATE_CONFIG } from "../constants/app.constants";
import type {
  AppVersionCheckData,
  AppVersionCheckParams,
  AppVersionCheckResponse
} from "../types/appUpdate";
import { api } from "./api";
import { API_ENDPOINTS } from "./apiEndpoints";

const isVersionCheckData = (data: unknown): data is AppVersionCheckData => {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as Record<string, unknown>;

  return (
    typeof candidate.currentVersion === "string" &&
    typeof candidate.latestVersion === "string" &&
    typeof candidate.updateAvailable === "boolean" &&
    typeof candidate.forceUpdate === "boolean" &&
    typeof candidate.downloadUrl === "string" &&
    typeof candidate.releaseNotes === "string"
  );
};

const getElectronVersion = async (): Promise<string> => {
  const version =
    (await window.sportsLedger?.getVersion()) ?? (await window.crickTrack?.getVersion?.());

  if (!version) {
    throw new Error("Unable to read the installed application version.");
  }

  return version;
};

export const appUpdateService = {
  getInstalledVersion: getElectronVersion,

  checkVersion: async (
    params: AppVersionCheckParams
  ): Promise<AppVersionCheckResponse> => {
    const response = await api.get<AppVersionCheckResponse>(
      API_ENDPOINTS.APP.VERSION_CHECK,
      { params }
    );

    if (!response.data.success || !isVersionCheckData(response.data.data)) {
      throw new Error("The version check response was invalid.");
    }

    return response.data;
  },

  checkCurrentVersion: async (): Promise<AppVersionCheckResponse> => {
    const currentVersion = await getElectronVersion();

    return appUpdateService.checkVersion({
      currentVersion,
      platform: APP_UPDATE_CONFIG.PLATFORM
    });
  },

  openDownloadUrl: async (downloadUrl: string): Promise<boolean> => {
    const openExternal = window.sportsLedger?.openExternal ?? window.crickTrack?.openExternal;

    if (!openExternal) {
      throw new Error("Unable to open the download link from this environment.");
    }

    return openExternal(downloadUrl);
  }
};
