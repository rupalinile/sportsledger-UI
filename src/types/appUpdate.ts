export interface AppVersionCheckParams {
  currentVersion: string;
  platform: string;
}

export interface AppVersionCheckData {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  forceUpdate: boolean;
  downloadUrl: string;
  releaseNotes: string;
}

export interface AppVersionCheckResponse {
  success: boolean;
  data: AppVersionCheckData;
}

export type AppUpdateStatus = "idle" | "loading" | "success" | "error";

export interface AppUpdateState {
  status: AppUpdateStatus;
  installedVersion: string | null;
  updateInfo: AppVersionCheckData | null;
  errorMessage: string | null;
}
