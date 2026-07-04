import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import { fonts } from "../../lib/theme";
import { api } from "../../lib/api";

interface RideDetail {
  id: string;
  origin_address: string;
  destination_address: string;
  scheduled_at: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: string;
  driver: {
    id: string;
    full_name: string;
    rating: number;
    total_rides: number;
  };
  vehicle: { make: string; model: string; year: number; plate_number: string };
}

interface Booking {
  id: string;
  status: string;
  seats_booked: number;
  total_amount: number;
  created_at: string;
  hop_in_address: string | null;
  hop_off_address: string | null;
  rider: {
    id: string;
    full_name: string;
    phone: string;
    avatar_url: string | null;
  };
}

const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  paid: "#22C55E",
  cancelled: "#EF4444",
  no_seat: "#8B5CF6",
  no_show: "#6B7280",
};

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  paid: "Paid",
  cancelled: "Cancelled",
  no_seat: "No Seat",
  no_show: "No Show",
};

const RIDE_STATUS_COLORS: Record<string, string> = {
  open: "#22C55E",
  in_progress: "#3B82F6",
  completed: "#6B7280",
  cancelled: "#EF4444",
};

export default function RideManagementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, isDark } = useTheme();

  const [ride, setRide] = useState<RideDetail | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setIsRefreshing(true);
      try {
        const [rideRes, bookingsRes] = await Promise.all([
          api.get(`/api/v1/rides/${id}`),
          api.get(`/api/v1/rides/${id}/bookings`),
        ]);
        setRide(rideRes.data.data);
        setBookings(bookingsRes.data.data ?? []);
      } catch (err) {
        Alert.alert("Error", "Failed to load ride details.");
        router.back();
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [id],
  );

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const handleConfirmBooking = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      await api.post(`/api/v1/bookings/${bookingId}/confirm`);
      fetchData();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error?.message ?? "Failed to confirm booking.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setActionLoading(bookingId);
            try {
              await api.post(`/api/v1/bookings/${bookingId}/cancel`);
              fetchData();
            } catch (err: any) {
              Alert.alert(
                "Error",
                err.response?.data?.error?.message ??
                  "Failed to cancel booking.",
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const handleUpdateRideStatus = async (newStatus: string) => {
    const labels: Record<string, string> = {
      in_progress: "Start Ride",
      completed: "Complete Ride",
      cancelled: "Cancel Ride",
    };
    Alert.alert(
      labels[newStatus] ?? "Update Status",
      `Are you sure you want to ${(labels[newStatus] ?? newStatus).toLowerCase()}?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: newStatus === "cancelled" ? "destructive" : "default",
          onPress: async () => {
            setIsUpdatingStatus(true);
            try {
              await api.patch(`/api/v1/rides/${id}/status`, {
                status: newStatus,
              });
              fetchData();
            } catch (err: any) {
              Alert.alert(
                "Error",
                err.response?.data?.error?.message ??
                  "Failed to update ride status.",
              );
            } finally {
              setIsUpdatingStatus(false);
            }
          },
        },
      ],
    );
  };

  if (isLoading || !ride) {
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

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const otherBookings = bookings.filter((b) => b.status !== "pending");
  const rideStatusColor = RIDE_STATUS_COLORS[ride.status] ?? "#6B7280";

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
          gap: 12,
        }}
      >
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
          Ride Management
        </Text>
      </View>

      <FlatList
        data={[...pendingBookings, ...otherBookings]}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchData(true)}
            tintColor={theme.brand}
          />
        }
        ListHeaderComponent={
          <>
            {/* Ride info card */}
            <View
              style={{
                backgroundColor: theme.surface,
                borderRadius: 16,
                padding: 16,
                margin: 16,
                marginBottom: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              {/* Status badge */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    backgroundColor: rideStatusColor + "20",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: rideStatusColor,
                      fontFamily: fonts.semibold,
                      fontSize: 12,
                    }}
                  >
                    {ride.status.replace("_", " ").toUpperCase()}
                  </Text>
                </View>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontFamily: fonts.regular,
                    fontSize: 12,
                  }}
                >
                  {new Date(ride.scheduled_at).toLocaleString("en-IN", {
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
                      fontSize: 14,
                      flex: 1,
                    }}
                  >
                    {ride.origin_address}
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
                      fontSize: 14,
                      flex: 1,
                    }}
                  >
                    {ride.destination_address}
                  </Text>
                </View>
              </View>

              {/* Stats row */}
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
                  {ride.seats_available}/{ride.seats_total} seats left
                </Text>
                <Text
                  style={{
                    color: theme.actionBg,
                    fontFamily: fonts.bold,
                    fontSize: 15,
                  }}
                >
                  ₹{ride.price_per_seat}/seat
                </Text>
              </View>
            </View>

            {/* Ride status actions */}
            {ride.status === "open" && (
              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginHorizontal: 16,
                  marginBottom: 12,
                }}
              >
                <Pressable
                  onPress={() => handleUpdateRideStatus("in_progress")}
                  disabled={isUpdatingStatus}
                  style={{
                    flex: 1,
                    backgroundColor: theme.brand,
                    borderRadius: 12,
                    paddingVertical: 13,
                    alignItems: "center",
                  }}
                >
                  {isUpdatingStatus ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text
                      style={{
                        color: "#fff",
                        fontFamily: fonts.semibold,
                        fontSize: 14,
                      }}
                    >
                      ▶ Start Ride
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => handleUpdateRideStatus("cancelled")}
                  disabled={isUpdatingStatus}
                  style={{
                    flex: 1,
                    backgroundColor: theme.error + "15",
                    borderWidth: 1,
                    borderColor: theme.error,
                    borderRadius: 12,
                    paddingVertical: 13,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: theme.error,
                      fontFamily: fonts.semibold,
                      fontSize: 14,
                    }}
                  >
                    ✕ Cancel Ride
                  </Text>
                </Pressable>
              </View>
            )}

            {ride.status === "in_progress" && (
              <Pressable
                onPress={() => handleUpdateRideStatus("completed")}
                disabled={isUpdatingStatus}
                style={{
                  marginHorizontal: 16,
                  marginBottom: 12,
                  backgroundColor: theme.success,
                  borderRadius: 12,
                  paddingVertical: 13,
                  alignItems: "center",
                }}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text
                    style={{
                      color: "#fff",
                      fontFamily: fonts.semibold,
                      fontSize: 14,
                    }}
                  >
                    ✓ Complete Ride
                  </Text>
                )}
              </Pressable>
            )}

            {/* Bookings header */}
            {bookings.length > 0 && (
              <Text
                style={{
                  color: theme.textSecondary,
                  fontFamily: fonts.semibold,
                  fontSize: 11,
                  marginHorizontal: 16,
                  marginBottom: 8,
                }}
              >
                BOOKINGS ({bookings.length})
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🎫</Text>
            <Text
              style={{
                color: theme.textSecondary,
                fontFamily: fonts.medium,
                fontSize: 14,
              }}
            >
              No bookings yet
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 32 }}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 16,
              marginHorizontal: 16,
              marginBottom: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            {/* Rider info + status */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.brand,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: fonts.bold,
                    fontSize: 16,
                  }}
                >
                  {item.rider.full_name?.charAt(0)?.toUpperCase() ?? "R"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.textPrimary,
                    fontFamily: fonts.semibold,
                    fontSize: 15,
                  }}
                >
                  {item.rider.full_name || "Rider"}
                </Text>
                <Text
                  style={{
                    color: theme.textSecondary,
                    fontFamily: fonts.regular,
                    fontSize: 12,
                  }}
                >
                  {item.rider.phone}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor:
                    (BOOKING_STATUS_COLORS[item.status] ?? "#6B7280") + "20",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: BOOKING_STATUS_COLORS[item.status] ?? "#6B7280",
                    fontFamily: fonts.semibold,
                    fontSize: 12,
                  }}
                >
                  {BOOKING_STATUS_LABELS[item.status] ?? item.status}
                </Text>
              </View>
            </View>

            {/* Hop in/off */}
            {(item.hop_in_address || item.hop_off_address) && (
              <View style={{ gap: 4, marginBottom: 12 }}>
                {item.hop_in_address && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: theme.mapPickup,
                      }}
                    />
                    <Text
                      numberOfLines={1}
                      style={{
                        color: theme.textSecondary,
                        fontFamily: fonts.regular,
                        fontSize: 12,
                        flex: 1,
                      }}
                    >
                      {item.hop_in_address}
                    </Text>
                  </View>
                )}
                {item.hop_off_address && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: theme.mapDestination,
                      }}
                    />
                    <Text
                      numberOfLines={1}
                      style={{
                        color: theme.textSecondary,
                        fontFamily: fonts.regular,
                        fontSize: 12,
                        flex: 1,
                      }}
                    >
                      {item.hop_off_address}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Amount + seats */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: theme.divider,
                marginBottom: item.status === "pending" ? 12 : 0,
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
                  fontSize: 14,
                }}
              >
                ₹{item.total_amount}
              </Text>
            </View>

            {/* Confirm/Cancel actions — only for pending */}
            {item.status === "pending" && (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => handleConfirmBooking(item.id)}
                  disabled={actionLoading === item.id}
                  style={{
                    flex: 1,
                    backgroundColor: theme.success,
                    borderRadius: 10,
                    paddingVertical: 11,
                    alignItems: "center",
                  }}
                >
                  {actionLoading === item.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text
                      style={{
                        color: "#fff",
                        fontFamily: fonts.semibold,
                        fontSize: 14,
                      }}
                    >
                      ✓ Confirm
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={() => handleCancelBooking(item.id)}
                  disabled={actionLoading === item.id}
                  style={{
                    flex: 1,
                    backgroundColor: theme.error + "15",
                    borderWidth: 1,
                    borderColor: theme.error,
                    borderRadius: 10,
                    paddingVertical: 11,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: theme.error,
                      fontFamily: fonts.semibold,
                      fontSize: 14,
                    }}
                  >
                    ✕ Reject
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}
