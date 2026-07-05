import { useEffect } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { connectSocket, disconnectSocket, getSocket } from "../lib/socket";
import { useAuthStore } from "../store/authStore";

export function useSocket() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    connectSocket().catch((err) => {
      console.log("[socket] failed to connect:", err.message);
    });

    return () => {
      // don't disconnect on component unmount — keep alive globally
    };
  }, [isAuthenticated]);
}

export function useSocketEvents() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const setupListeners = async () => {
      const socket = await connectSocket();

      // ── Rider events ──────────────────────────────────────────

      socket.on("booking.confirmed", (data) => {
        Alert.alert(
          "Booking Confirmed! ✅",
          data.message ??
            "Your booking is confirmed. Complete payment to secure your seat.",
          [
            {
              text: "Pay Now",
              onPress: () => router.push(`/booking/${data.bookingId}`),
            },
            { text: "Later", style: "cancel" },
          ],
        );
      });

      socket.on("booking.cancelled", (data) => {
        Alert.alert(
          "Booking Cancelled ❌",
          data.message ?? "A booking has been cancelled.",
          [{ text: "OK" }],
        );
      });

      socket.on("booking.no_seat", (data) => {
        Alert.alert(
          "No Seat Available 😕",
          data.message ??
            "Sorry, no seats available. You will be refunded shortly.",
          [{ text: "OK" }],
        );
      });

      socket.on("ride.status_changed", (data) => {
        const statusMessages: Record<string, string> = {
          in_progress: "Your ride has started! 🚗",
          completed: "Your ride is complete! Hope you enjoyed it. 🎉",
          cancelled: "Your ride has been cancelled. 😕",
        };
        Alert.alert(
          "Ride Update",
          statusMessages[data.status] ?? data.message,
          [{ text: "OK" }],
        );
      });

      socket.on("driver.approved", (data) => {
        Alert.alert(
          "Driver Application Approved! 🎉",
          data.message ??
            "Your driver application has been approved. Switch to driver mode to start offering rides.",
          [
            {
              text: "Switch to Driver",
              onPress: () => router.push("/(tabs)/profile"),
            },
            { text: "Later", style: "cancel" },
          ],
        );
      });

      socket.on("driver.rejected", (data) => {
        Alert.alert(
          "Application Not Approved",
          data.message ?? "Your driver application was not approved.",
          [{ text: "OK" }],
        );
      });

      // ── Driver events ─────────────────────────────────────────

      socket.on("booking.requested", (data) => {
        Alert.alert(
          "New Booking Request! 🎫",
          data.message ?? "A rider wants to book your ride.",
          [
            {
              text: "View",
              onPress: () => router.push(`/ride-management/${data.rideId}`),
            },
            { text: "Later", style: "cancel" },
          ],
        );
      });

      socket.on("payment.completed", (data) => {
        Alert.alert(
          "Payment Received! 💰",
          data.message ?? "A rider has paid. Seat confirmed.",
          [
            {
              text: "View Ride",
              onPress: () => router.push(`/ride-management/${data.rideId}`),
            },
            { text: "OK", style: "cancel" },
          ],
        );
      });
    };

    setupListeners().catch(console.error);

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off("booking.confirmed");
        socket.off("booking.cancelled");
        socket.off("booking.no_seat");
        socket.off("ride.status_changed");
        socket.off("driver.approved");
        socket.off("driver.rejected");
        socket.off("booking.requested");
        socket.off("payment.completed");
      }
    };
  }, [isAuthenticated]);
}
