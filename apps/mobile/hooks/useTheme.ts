import { useColorScheme } from "react-native";
import { lightTheme, darkTheme, Theme } from "../lib/theme";

export function useTheme(): { theme: Theme; isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return { theme: isDark ? darkTheme : lightTheme, isDark };
}
