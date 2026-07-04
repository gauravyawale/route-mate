import { create } from "zustand";
import { setTokens, clearTokens } from "../lib/auth";

interface AppUser {
  id: string;
  phone: string;
  full_name: string;
  email: string | null;
  active_mode: "rider" | "driver";
  is_driver_approved: boolean;
  is_verified: boolean;
  role: string;
}

interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  setUser: (
    user: AppUser,
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
  updateUser: (user: AppUser) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: async (user, accessToken, refreshToken) => {
    await setTokens(accessToken, refreshToken);
    set({ user, isAuthenticated: true });
  },

  updateUser: (user) => set({ user }),

  logout: async () => {
    await clearTokens();
    set({ user: null, isAuthenticated: false });
  },
}));
