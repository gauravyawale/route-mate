import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface LocationPoint {
  address: string;
  lat: number;
  lng: number;
}

export interface SearchLeg {
  origin: LocationPoint | null;
  destination: LocationPoint | null;
  scheduledAt: string | null;
}

interface SearchState {
  to: SearchLeg;
  fro: SearchLeg;
  activeTab: "to" | "fro";
  setActiveTab: (tab: "to" | "fro") => void;
  setLeg: (tab: "to" | "fro", leg: Partial<SearchLeg>) => void;
  resetLeg: (tab: "to" | "fro") => void;
}

const emptyLeg: SearchLeg = {
  origin: null,
  destination: null,
  scheduledAt: null,
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      to: emptyLeg,
      fro: emptyLeg,
      activeTab: "to",
      setActiveTab: (tab) => set({ activeTab: tab }),
      setLeg: (tab, leg) =>
        set((state) => ({ [tab]: { ...state[tab], ...leg } })),
      resetLeg: (tab) => set(() => ({ [tab]: emptyLeg })),
    }),
    {
      name: "route-mate-search",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
