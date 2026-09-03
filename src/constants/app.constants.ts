export const APP_CONFIG = {
  APP_NAME: "SportLedger",
  APP_TAGLINE: "Play Together. Track Every Expense.",
  SIDEBAR_WIDTH: 288,
  HEADER_HEIGHT: 64
} as const;

export const LOCAL_STORAGE_KEYS = {
  THEME_MODE: "cricktrack.themeMode",
  ACCESS_TOKEN: "cricktrack.accessToken",
  REFRESH_TOKEN: "cricktrack.refreshToken",
  AUTH_USER: "cricktrack.authUser",
  SUBSCRIPTION: "cricktrack.subscription"
} as const;

export const STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error"
} as const;
