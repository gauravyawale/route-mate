import { Tabs } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import { useCurrentUser } from "../../hooks/useCurrentUser";

export default function TabsLayout() {
  const { theme } = useTheme();
  useCurrentUser();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.navActive,
        tabBarInactiveTintColor: theme.navInactive,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="bookings" options={{ title: "Bookings" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
