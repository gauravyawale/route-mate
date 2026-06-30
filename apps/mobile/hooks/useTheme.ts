import { useColorScheme } from "react-native";
import { lightTheme, darkTheme, Theme } from "../lib/theme";
import { useThemeStore } from "../store/themeStore";

export function useTheme(): { theme: Theme; isDark: boolean } {
  const systemScheme = useColorScheme();
  const { mode } = useThemeStore();

  const isDark = mode === "system" ? systemScheme === "dark" : mode === "dark";

  return { theme: isDark ? darkTheme : lightTheme, isDark };
}
