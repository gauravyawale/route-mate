import { View, Text } from "react-native";
import { useTheme } from "../hooks/useTheme";

export default function SearchResultsScreen() {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: theme.textPrimary }}>Results coming next</Text>
    </View>
  );
}
