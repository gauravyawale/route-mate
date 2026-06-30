import { View, Text, Pressable, Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import { useThemeStore } from "../../store/themeStore";
import { useAuthStore } from "../../store/authStore";
import { fonts } from "../../lib/theme";

const themeOptions: Array<{
  label: string;
  value: "light" | "dark" | "system";
}> = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

export default function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const { mode, setMode } = useThemeStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 60,
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            color: theme.textPrimary,
            fontSize: 26,
            fontFamily: fonts.bold,
            marginBottom: 24,
          }}
        >
          Profile
        </Text>

        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 18,
            padding: 18,
            marginBottom: 28,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.06,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: theme.brand,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: theme.textInverse,
                fontSize: 22,
                fontFamily: fonts.bold,
              }}
            >
              {user?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.textPrimary,
                fontSize: 17,
                fontFamily: fonts.semibold,
              }}
            >
              {user?.full_name || "Add your name"}
            </Text>
            <Text
              style={{
                color: theme.textSecondary,
                fontSize: 14,
                marginTop: 2,
                fontFamily: fonts.regular,
              }}
            >
              {user?.phone}
            </Text>
          </View>
        </View>

        <Text
          style={{
            color: theme.textSecondary,
            fontSize: 13,
            marginBottom: 10,
            fontFamily: fonts.medium,
          }}
        >
          APPEARANCE
        </Text>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: theme.elevated,
            borderRadius: 14,
            padding: 4,
            marginBottom: 28,
          }}
        >
          {themeOptions.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setMode(opt.value)}
              style={{
                flex: 1,
                paddingVertical: 11,
                borderRadius: 11,
                alignItems: "center",
                backgroundColor:
                  mode === opt.value ? theme.brand : "transparent",
              }}
            >
              <Text
                style={{
                  color:
                    mode === opt.value
                      ? theme.textInverse
                      : theme.textSecondary,
                  fontFamily: fonts.semibold,
                  fontSize: 13,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={handleLogout}
          style={{
            backgroundColor: theme.surface,
            borderWidth: 1.5,
            borderColor: theme.error,
            borderRadius: 14,
            paddingVertical: 15,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              color: theme.error,
              fontFamily: fonts.semibold,
              fontSize: 15,
            }}
          >
            Log Out
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
