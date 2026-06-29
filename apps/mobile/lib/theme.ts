// Single source of truth for the app's color system.
// Two flat objects — light and dark — selected at runtime via useColorScheme()
// or a manual toggle. Components read from `theme.colors.X`, never raw hex.

export const lightTheme = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  elevated: "#FFFFFF",

  brand: "#2563EB",

  actionBg: "#F97316",
  actionHover: "#EA580C",
  actionText: "#FFFFFF",

  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",

  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textDisabled: "#94A3B8",
  textInverse: "#FFFFFF",

  inputBg: "#FFFFFF",
  inputBorder: "#CBD5E1",
  inputFocusBorder: "#2563EB",

  navActive: "#2563EB",
  navInactive: "#94A3B8",

  mapRoute: "#2563EB",
  mapRouteAlt: "#94A3B8",
  mapDriver: "#F97316",
  mapPickup: "#22C55E",
  mapDestination: "#EF4444",
  mapCurrentLocation: "#2563EB",

  border: "#E2E8F0",
  divider: "#E2E8F0",
};

export const darkTheme = {
  background: "#0B1220",
  surface: "#172033",
  elevated: "#1E293B",

  brand: "#3B82F6",

  actionBg: "#FB923C",
  actionHover: "#F97316",
  actionText: "#FFFFFF",

  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",

  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textDisabled: "#64748B",
  textInverse: "#FFFFFF",

  inputBg: "#172033",
  inputBorder: "#334155",
  inputFocusBorder: "#3B82F6",

  navActive: "#3B82F6",
  navInactive: "#64748B",

  mapRoute: "#3B82F6",
  mapRouteAlt: "#64748B",
  mapDriver: "#FB923C",
  mapPickup: "#22C55E",
  mapDestination: "#EF4444",
  mapCurrentLocation: "#3B82F6",

  border: "#334155",
  divider: "#334155",
};

export type Theme = typeof lightTheme;
