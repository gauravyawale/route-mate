import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTheme } from "../hooks/useTheme";
import { fonts } from "../lib/theme";
import { api } from "../lib/api";

interface Ride {
  id: string;
  origin_address: string;
  destination_address: string;
  scheduled_at: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: "#22C55E",
  in_progress: "#3B82F6",
  completed: "#6B7280",
  cancelled: "#EF4444",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function MyRidesScreen() {
  const { theme, isDark } = useTheme();
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRides = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const res = await api.get("/api/v1/rides/my");
      setRides(res.data.data ?? []);
    } catch (err) {
      console.error("Failed to fetch rides", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // refresh every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchRides();
    }, [fetchRides]),
  );

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator color={theme.brand} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable onPress={() => router.back()}>
            <Text
              style={{
                color: theme.brand,
                fontFamily: fonts.medium,
                fontSize: 16,
              }}
            >
              ← Back
            </Text>
          </Pressable>
          <Text
            style={{
              color: theme.textPrimary,
              fontFamily: fonts.bold,
              fontSize: 20,
            }}
          >
            My Rides
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/create-ride")}
          style={{
            backgroundColor: theme.actionBg,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
        >
          <Text
            style={{ color: "#fff", fontFamily: fonts.semibold, fontSize: 13 }}
          >
            + New
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchRides(true)}
            tintColor={theme.brand}
          />
        }
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 80,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🚗</Text>
            <Text
              style={{
                color: theme.textPrimary,
                fontFamily: fonts.semibold,
                fontSize: 18,
                marginBottom: 8,
              }}
            >
              No Rides Yet
            </Text>
            <Text
              style={{
                color: theme.textSecondary,
                fontFamily: fonts.regular,
                fontSize: 14,
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              Create your first ride and start picking up passengers.
            </Text>
            <Pressable
              onPress={() => router.push("/create-ride")}
              style={{
                backgroundColor: theme.actionBg,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 32,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontFamily: fonts.semibold,
                  fontSize: 15,
                }}
              >
                Create Ride
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/ride-management/${item.id}`)}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            {/* Status + date */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  backgroundColor:
                    (STATUS_COLORS[item.status] ?? "#6B7280") + "20",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: STATUS_COLORS[item.status] ?? "#6B7280",
                    fontFamily: fonts.semibold,
                    fontSize: 12,
                  }}
                >
                  {STATUS_LABELS[item.status] ?? item.status}
                </Text>
              </View>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontFamily: fonts.regular,
                  fontSize: 12,
                }}
              >
                {new Date(item.scheduled_at).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            {/* Route */}
            <View style={{ gap: 6, marginBottom: 12 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.mapPickup,
                  }}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    color: theme.textPrimary,
                    fontFamily: fonts.medium,
                    fontSize: 13,
                    flex: 1,
                  }}
                >
                  {item.origin_address}
                </Text>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.mapDestination,
                  }}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    color: theme.textSecondary,
                    fontFamily: fonts.medium,
                    fontSize: 13,
                    flex: 1,
                  }}
                >
                  {item.destination_address}
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: theme.divider,
              }}
            >
              <Text
                style={{
                  color: theme.textSecondary,
                  fontFamily: fonts.regular,
                  fontSize: 13,
                }}
              >
                {item.seats_available}/{item.seats_total} seats left
              </Text>
              <Text
                style={{
                  color: theme.actionBg,
                  fontFamily: fonts.bold,
                  fontSize: 15,
                }}
              >
                ₹{item.price_per_seat}/seat
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
