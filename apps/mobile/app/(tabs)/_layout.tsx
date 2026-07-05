import { Tabs } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useSocket, useSocketEvents } from "../../hooks/useSocket";
import { useAuthStore } from "../../store/authStore";
import { useEffect } from "react";
import { registerForPushNotifications } from "../../lib/notifications";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

export default function TabsLayout() {
  const { theme } = useTheme();
  useCurrentUser();
  useSocket(); // connects socket when authenticated
  useSocketEvents(); // registers all event listeners

  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;
    registerForPushNotifications();

    // handle tap on notification when app is in background
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.screen === "booking" && data?.bookingId) {
          router.push(`/booking/${data.bookingId}`);
        } else if (data?.screen === "ride" && data?.rideId) {
          router.push(`/ride-management/${data.rideId}`);
        }
      },
    );

    return () => subscription.remove();
  }, [isAuthenticated]);

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
