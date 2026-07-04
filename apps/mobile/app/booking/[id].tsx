import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, router } from "expo-router";
import { useTheme } from "../../hooks/useTheme";
import { fonts } from "../../lib/theme";
import { api } from "../../lib/api";

interface BookingDetail {
  id: string;
  status: string;
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
  rider: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    phone: string;
  };
}

interface RazorpayOrder {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  booking_id: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  paid: "#22C55E",
  cancelled: "#EF4444",
  no_seat: "#8B5CF6",
  no_show: "#6B7280",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting Driver Confirmation",
  confirmed: "Confirmed — Payment Pending",
  paid: "Paid",
  cancelled: "Cancelled",
  no_seat: "No Seat Available",
  no_show: "No Show",
};

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, isDark } = useTheme();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState<RazorpayOrder | null>(
    null,
  );
  const [showPayment, setShowPayment] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      // getMyBookings returns all bookings — find the one we need
      const res = await api.get("/api/v1/bookings/my");
      const all: BookingDetail[] = res.data.data ?? [];
      const found = all.find((b) => b.id === id);
      if (!found) {
        Alert.alert("Error", "Booking not found.");
        router.back();
        return;
      }
      setBooking(found);
    } catch (err) {
      Alert.alert("Error", "Failed to load booking.");
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!booking) return;
    setIsCreatingOrder(true);
    try {
      const res = await api.post("/api/v1/payments", {
        booking_id: booking.id,
      });

      const payment = res.data.data;
      // map actual response shape to what WebView needs
      setRazorpayOrder({
        order_id: payment.order.id, // "order_T9WFIgzMjs7Gq5"
        amount: payment.order.amount, // 8000 (paise)
        currency: payment.order.currency, // "INR"
        key_id: payment.order.key_id, // "rzp_test_..."
        booking_id: payment.booking_id,
      });
      setShowPayment(true);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.error?.message ?? "Failed to create payment order.",
      );
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === "PAYMENT_SUCCESS") {
        setShowPayment(false);
        setIsVerifying(true);
        try {
          await api.post("/api/v1/payments/verify", {
            razorpay_order_id: message.razorpay_order_id,
            razorpay_payment_id: message.razorpay_payment_id,
            razorpay_signature: message.razorpay_signature,
            booking_id: booking!.id,
          });
          Alert.alert(
            "Payment Successful! 🎉",
            "Your seat is confirmed. Have a great ride!",
            [
              {
                text: "OK",
                onPress: () => {
                  fetchBooking(); // refresh booking status
                },
              },
            ],
          );
        } catch (err: any) {
          Alert.alert(
            "Verification Failed",
            err.response?.data?.error?.message ??
              "Payment verification failed. Contact support.",
          );
        } finally {
          setIsVerifying(false);
        }
      }

      if (message.type === "PAYMENT_FAILED") {
        setShowPayment(false);
        Alert.alert(
          "Payment Failed",
          "Your payment was not completed. Please try again.",
        );
      }

      if (message.type === "PAYMENT_DISMISSED") {
        setShowPayment(false);
      }
    } catch (err) {
      // ignore non-JSON messages from WebView
    }
  };

  // Razorpay checkout HTML injected into WebView
  const getPaymentHTML = (
    order: RazorpayOrder,
    user: BookingDetail["rider"],
  ) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <style>
        body { margin: 0; background: #000; display: flex; align-items: center; justify-content: center; height: 100vh; }
        .loading { color: white; font-family: sans-serif; font-size: 16px; }
      </style>
    </head>
    <body>
      <p class="loading">Opening payment...</p>
      <script>
        var options = {
          key: "${order.key_id}",
          amount: "${order.amount}",
          currency: "${order.currency}",
          order_id: "${order.order_id}",
          name: "Route Mate",
          description: "Ride Booking Payment",
          prefill: {
            contact: "${user.phone}",
            name: "${user.full_name}",
          },
          theme: { color: "#2563EB" },
          handler: function(response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: "PAYMENT_SUCCESS",
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }));
          },
          modal: {
            ondismiss: function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "PAYMENT_DISMISSED",
              }));
            }
          }
        };
        var rzp = new Razorpay(options);
        rzp.on("payment.failed", function(response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "PAYMENT_FAILED",
            error: response.error,
          }));
        });
        rzp.open();
      </script>
    </body>
    </html>
  `;

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

  if (!booking) return null;

  const statusColor = STATUS_COLORS[booking.status] ?? "#6B7280";

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
          Booking Detail
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status card */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            padding: 16,
            alignItems: "center",
            gap: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View
            style={{
              backgroundColor: statusColor + "20",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                color: statusColor,
                fontFamily: fonts.bold,
                fontSize: 16,
              }}
            >
              {STATUS_LABELS[booking.status] ?? booking.status}
            </Text>
          </View>
          <Text
            style={{
              color: theme.textSecondary,
              fontFamily: fonts.regular,
              fontSize: 12,
            }}
          >
            Booked on{" "}
            {new Date(booking.created_at).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        {/* Route card */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            padding: 16,
            gap: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Text
            style={{
              color: theme.textSecondary,
              fontFamily: fonts.semibold,
              fontSize: 11,
            }}
          >
            RIDE ROUTE
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: theme.mapPickup,
              }}
            />
            <Text
              numberOfLines={2}
              style={{
                color: theme.textPrimary,
                fontFamily: fonts.medium,
                fontSize: 14,
                flex: 1,
              }}
            >
              {booking.ride.origin_address}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: theme.mapDestination,
              }}
            />
            <Text
              numberOfLines={2}
              style={{
                color: theme.textSecondary,
                fontFamily: fonts.medium,
                fontSize: 14,
                flex: 1,
              }}
            >
              {booking.ride.destination_address}
            </Text>
          </View>
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: theme.divider,
              paddingTop: 12,
            }}
          >
            <Text
              style={{
                color: theme.textSecondary,
                fontFamily: fonts.regular,
                fontSize: 12,
              }}
            >
              {new Date(booking.ride.scheduled_at).toLocaleString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>

        {/* Your journey card */}
        {(booking.hop_in_address || booking.hop_off_address) && (
          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 16,
              gap: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Text
              style={{
                color: theme.textSecondary,
                fontFamily: fonts.semibold,
                fontSize: 11,
              }}
            >
              YOUR JOURNEY
            </Text>
            {booking.hop_in_address && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: theme.mapPickup,
                    marginTop: 3,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: 11,
                      fontFamily: fonts.medium,
                    }}
                  >
                    PICKUP
                  </Text>
                  <Text
                    style={{
                      color: theme.textPrimary,
                      fontSize: 14,
                      fontFamily: fonts.medium,
                    }}
                  >
                    {booking.hop_in_address}
                  </Text>
                </View>
              </View>
            )}
            {booking.hop_off_address && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: theme.mapDestination,
                    marginTop: 3,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.textSecondary,
                      fontSize: 11,
                      fontFamily: fonts.medium,
                    }}
                  >
                    DROP
                  </Text>
                  <Text
                    style={{
                      color: theme.textPrimary,
                      fontSize: 14,
                      fontFamily: fonts.medium,
                    }}
                  >
                    {booking.hop_off_address}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Payment summary */}
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 16,
            padding: 16,
            gap: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Text
            style={{
              color: theme.textSecondary,
              fontFamily: fonts.semibold,
              fontSize: 11,
            }}
          >
            PAYMENT
          </Text>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text
              style={{
                color: theme.textSecondary,
                fontFamily: fonts.regular,
                fontSize: 14,
              }}
            >
              {booking.seats_booked} seat × ₹{booking.ride.price_per_seat}
            </Text>
            <Text
              style={{
                color: theme.textPrimary,
                fontFamily: fonts.bold,
                fontSize: 14,
              }}
            >
              ₹{booking.total_amount}
            </Text>
          </View>
          {booking.paid_at && (
            <Text
              style={{
                color: theme.success,
                fontFamily: fonts.medium,
                fontSize: 12,
              }}
            >
              Paid on{" "}
              {new Date(booking.paid_at).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
        </View>

        {/* Pay Now button — only when confirmed */}
        {booking.status === "confirmed" && (
          <Pressable
            onPress={handlePayNow}
            disabled={isCreatingOrder || isVerifying}
            style={{
              backgroundColor: theme.actionBg,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              shadowColor: theme.actionBg,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {isCreatingOrder || isVerifying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: fonts.bold,
                  fontSize: 16,
                }}
              >
                Pay ₹{booking.total_amount}
              </Text>
            )}
          </Pressable>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Razorpay WebView Modal */}
      <Modal
        visible={showPayment}
        animationType="slide"
        onRequestClose={() => setShowPayment(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <View
            style={{
              paddingTop: 50,
              paddingHorizontal: 16,
              paddingBottom: 12,
              backgroundColor: theme.surface,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: theme.textPrimary,
                fontFamily: fonts.semibold,
                fontSize: 16,
              }}
            >
              Complete Payment
            </Text>
            <Pressable onPress={() => setShowPayment(false)}>
              <Text
                style={{
                  color: theme.brand,
                  fontFamily: fonts.medium,
                  fontSize: 15,
                }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
          {razorpayOrder && booking && (
            <WebView
              source={{ html: getPaymentHTML(razorpayOrder, booking.rider) }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              renderLoading={() => (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#000",
                  }}
                >
                  <ActivityIndicator color={theme.brand} size="large" />
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
