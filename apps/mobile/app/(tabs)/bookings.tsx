import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import { fonts } from "../../lib/theme";
import { api } from "../../lib/api";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "paid"
  | "cancelled"
  | "no_seat"
  | "no_show";

interface Booking {
  id: string;
  status: BookingStatus;
  seats_booked: number;
  total_amount: number;
  confirmed_at: string | null;
  paid_at: string | null;
  created_at: string;
  ride: {
    id: string;
    origin_address: string;
    destination_address: string;
    scheduled_at: string;
    price_per_seat: number;
    status: string;
  };
  hop_in_address: string | null;
  hop_off_address: string | null;
}

type FilterTab =
  | "active"
  | "pending"
  | "confirmed"
  | "paid"
  | "cancelled"
  | "past";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "paid", label: "Paid" },
  { key: "cancelled", label: "Cancelled" },
  { key: "past", label: "Past" },
];

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  paid: "#22C55E",
  cancelled: "#EF4444",
  no_seat: "#8B5CF6",
  no_show: "#6B7280",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  paid: "Paid",
  cancelled: "Cancelled",
  no_seat: "No Seat Available",
  no_show: "Completed", // ← rider perspective: ride happened, they no-showed
};

function filterBookings(bookings: Booking[], filter: FilterTab): Booking[] {
  if (filter === "active") {
    return bookings.filter((b) =>
      ["pending", "confirmed", "paid"].includes(b.status),
    );
  }
  if (filter === "cancelled") {
    return bookings.filter((b) => b.status === "cancelled");
  }
  if (filter === "past") {
    return bookings.filter((b) => ["no_seat", "no_show"].includes(b.status));
  }
  return bookings.filter((b) => b.status === filter);
}

export default function BookingsScreen() {
  const { theme, isDark } = useTheme();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("active");

  const fetchBookings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const res = await api.get("/api/v1/bookings/my");
      setBookings(res.data.data ?? []);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filtered = filterBookings(bookings, activeFilter);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 12,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      color: theme.textPrimary,
      fontFamily: fonts.bold,
      fontSize: 28,
    },
    filterRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
    },
    filterChipText: {
      fontFamily: fonts.medium,
      fontSize: 13,
    },
    card: {
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
    },
    emptyText: {
      color: theme.textSecondary,
      fontFamily: fonts.medium,
      fontSize: 15,
      marginTop: 8,
    },
  });

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <ActivityIndicator color={theme.brand} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {/* Filter tabs */}
      <View>
        <FlatList
          data={FILTER_TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => {
            const isActive = activeFilter === item.key;
            return (
              <Pressable
                onPress={() => setActiveFilter(item.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? theme.brand : "transparent",
                    borderColor: isActive ? theme.brand : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isActive ? "#FFFFFF" : theme.textSecondary,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Booking list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchBookings(true)}
            tintColor={theme.brand}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 40 }}>🎫</Text>
            <Text style={styles.emptyText}>No {activeFilter} bookings</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/booking/${item.id}`)}
          >
            {/* Status badge + date */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  backgroundColor: STATUS_COLORS[item.status] + "20",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: STATUS_COLORS[item.status],
                    fontFamily: fonts.semibold,
                    fontSize: 12,
                  }}
                >
                  {STATUS_LABELS[item.status]}
                </Text>
              </View>
              <Text
                style={{
                  color: theme.textSecondary,
                  fontFamily: fonts.regular,
                  fontSize: 12,
                }}
              >
                {new Date(item.ride.scheduled_at).toLocaleString("en-IN", {
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
                  {item.hop_in_address ?? item.ride.origin_address}
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
                  {item.hop_off_address ?? item.ride.destination_address}
                </Text>
              </View>
            </View>

            {/* Footer — amount + seats */}
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
                {item.seats_booked} seat{item.seats_booked > 1 ? "s" : ""}
              </Text>
              <Text
                style={{
                  color: theme.actionBg,
                  fontFamily: fonts.bold,
                  fontSize: 16,
                }}
              >
                ₹{item.total_amount}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
