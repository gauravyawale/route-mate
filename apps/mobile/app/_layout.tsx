import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { useAppFonts } from "../hooks/useAppFonts";
import { View } from "react-native";

export default function RootLayout() {
  const fontsLoaded = useAppFonts();

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: "#F8FAFC" }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="location-search"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="search-results"
          options={{
            headerShown: true,
            title: "Available Rides",
            headerStyle: { backgroundColor: "#2563EB" },
            headerTintColor: "#FFFFFF",
            headerTitleStyle: { fontFamily: "Inter_600SemiBold" },
          }}
        />
        <Stack.Screen
          name="ride/[id]"
          options={{
            headerShown: true,
            title: "Ride Details",
            headerStyle: { backgroundColor: "#2563EB" },
            headerTintColor: "#FFFFFF",
            headerTitleStyle: { fontFamily: "Inter_600SemiBold" },
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
