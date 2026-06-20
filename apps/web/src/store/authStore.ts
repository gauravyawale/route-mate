import { create } from "zustand";
import { setTokens, clearTokens } from "../lib/auth";
import { disconnectSocket } from "@/lib/socket";

interface AdminUser {
  id: string;
  phone: string;
  full_name: string;
  role: "admin";
}

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  setUser: (user: AdminUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user, accessToken, refreshToken) => {
    setTokens(accessToken, refreshToken);
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    clearTokens();
    disconnectSocket();
    set({ user: null, isAuthenticated: false });
  },
}));
