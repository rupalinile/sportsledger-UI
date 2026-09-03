import { LOCAL_STORAGE_KEYS } from "../constants/app.constants";
import type { AuthSubscription } from "../types/auth";

export const getStoredSubscription = (): AuthSubscription | null => {
  const storedSubscription = localStorage.getItem(LOCAL_STORAGE_KEYS.SUBSCRIPTION);

  if (!storedSubscription) {
    return null;
  }

  try {
    return JSON.parse(storedSubscription) as AuthSubscription;
  } catch {
    return null;
  }
};

export const isFreeSubscription = (subscription: AuthSubscription | null): boolean =>
  subscription?.planCode?.toUpperCase() === "FREE";
