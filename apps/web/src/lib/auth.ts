import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// Token management

export function setTokens(accessToken: string, refreshToken: string) {
  // access token — session cookie (cleared when browser closes)
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  // refresh token — 30 day persistent cookie
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
    expires: 30,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
}

export function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!Cookies.get(ACCESS_TOKEN_KEY);
}
