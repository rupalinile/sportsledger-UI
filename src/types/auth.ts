export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
}

export interface AuthSubscription {
  planCode: string;
  planName?: string;
  status: string;
  startDate?: string;
  endDate?: string | null;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: AuthUser;
  subscription: AuthSubscription;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: AuthUser;
  subscription: Pick<AuthSubscription, "planCode" | "status">;
}
