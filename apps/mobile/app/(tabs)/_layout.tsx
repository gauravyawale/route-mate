import { Tabs } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useSocket, useSocketEvents } from "../../hooks/useSocket";
import { useAuthStore } from "../../store/authStore";
import { useEffect } from "react";
import { registerForPushNotifications } from "../../lib/notifications";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  const { theme } = useTheme();
  useCurrentUser();
  useSocket();
  useSocketEvents();

  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;
    registerForPushNotifications();

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
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ticket" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
