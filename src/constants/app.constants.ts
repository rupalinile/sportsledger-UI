export const APP_CONFIG = {
  APP_NAME: "SportsLedger",
  APP_TAGLINE: "Play Together. Track Every Expense.",
  SIDEBAR_WIDTH: 288,
  HEADER_HEIGHT: 64
} as const;

export const APP_UPDATE_CONFIG = {
  PLATFORM: "windows"
} as const;

export const LOCAL_STORAGE_KEYS = {
  THEME_MODE: "sportsledger.themeMode",
  ACCESS_TOKEN: "sportsledger.accessToken",
  REFRESH_TOKEN: "sportsledger.refreshToken",
  AUTH_USER: "sportsledger.authUser",
  SUBSCRIPTION: "sportsledger.subscription"
} as const;

export const STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error"
} as const;
