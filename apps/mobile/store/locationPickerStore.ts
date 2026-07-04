import { create } from "zustand";

interface PickedLocation {
  address: string;
  lat: number;
  lng: number;
}

interface LocationPickerState {
  result: PickedLocation | null;
  forField: string | null;
  setResult: (field: string, location: PickedLocation) => void;
  clear: () => void;
}

export const useLocationPickerStore = create<LocationPickerState>((set) => ({
  result: null,
  forField: null,
  setResult: (field, location) => set({ result: location, forField: field }),
  clear: () => set({ result: null, forField: null }),
}));
