import { getIO } from "./index.js";
import { sendPushToUser } from "../../utils/pushNotifications.js";

/**
 * This is the single place all Socket.io emissions live.
 * Services call this instead of calling getIO() directly — keeps socket logic out of business logic.
 */

/**
 * Booking Notifications
 */

export async function notifyBookingRequested(payload: {
  driverUserId: string;
  bookingId: string;
  rideId: string;
  riderName: string;
  seatsBooked: number;
  hopInAddress: string;
}) {
  getIO()
    .to(payload.driverUserId)
    .emit("booking.requested", {
      bookingId: payload.bookingId,
      rideId: payload.rideId,
      riderName: payload.riderName,
      seatsBooked: payload.seatsBooked,
      hopInAddress: payload.hopInAddress,
      message: `${payload.riderName} wants to book ${payload.seatsBooked} seat(s)`,
    });

  await sendPushToUser(
    payload.driverUserId,
    "New Booking Request! 🎫",
    `${payload.riderName} wants to book ${payload.seatsBooked} seat(s) from ${payload.hopInAddress}`,
    { bookingId: payload.bookingId, rideId: payload.rideId, screen: "ride" },
  );
}

export async function notifyBookingConfirmed(payload: {
  riderUserId: string;
  bookingId: string;
  rideId: string;
}) {
  getIO().to(payload.riderUserId).emit("booking.confirmed", {
    bookingId: payload.bookingId,
    rideId: payload.rideId,
    message: "Your booking is confirmed. Complete payment to secure your seat.",
  });

  await sendPushToUser(
    payload.riderUserId,
    "Booking Confirmed! ✅",
    "Your booking is confirmed. Tap to pay and secure your seat.",
    { bookingId: payload.bookingId, rideId: payload.rideId, screen: "booking" },
  );
}

export async function notifyBookingCancelled(payload: {
  userId: string;
  bookingId: string;
  rideId: string;
  reason?: string;
}) {
  getIO().to(payload.userId).emit("booking.cancelled", {
    bookingId: payload.bookingId,
    rideId: payload.rideId,
    reason: payload.reason,
    message: "A booking has been cancelled.",
  });

  await sendPushToUser(
    payload.userId,
    "Booking Cancelled ❌",
    payload.reason
      ? `Your booking was cancelled. Reason: ${payload.reason}`
      : "A booking has been cancelled.",
    { bookingId: payload.bookingId, rideId: payload.rideId, screen: "booking" },
  );
}

export async function notifyPaymentCompleted(payload: {
  driverUserId: string;
  bookingId: string;
  rideId: string;
  riderName: string;
  amount: number;
}) {
  getIO()
    .to(payload.driverUserId)
    .emit("payment.completed", {
      bookingId: payload.bookingId,
      rideId: payload.rideId,
      riderName: payload.riderName,
      amount: payload.amount,
      message: `${payload.riderName} has paid ₹${payload.amount}. Seat confirmed.`,
    });

  await sendPushToUser(
    payload.driverUserId,
    "Payment Received! 💰",
    `${payload.riderName} has paid ₹${payload.amount}. Seat confirmed.`,
    { bookingId: payload.bookingId, rideId: payload.rideId, screen: "ride" },
  );
}

export async function notifyRideStatusChanged(payload: {
  riderUserId: string;
  rideId: string;
  status: string;
}) {
  getIO()
    .to(payload.riderUserId)
    .emit("ride.status_changed", {
      rideId: payload.rideId,
      status: payload.status,
      message: `Ride is now ${payload.status}.`,
    });

  const statusMessages: Record<string, string> = {
    in_progress: "Your ride has started! 🚗",
    completed: "Your ride is complete! Hope you enjoyed it. 🎉",
    cancelled: "Your ride has been cancelled. 😕",
  };

  await sendPushToUser(
    payload.riderUserId,
    "Ride Update 🚗",
    statusMessages[payload.status] ?? `Ride is now ${payload.status}.`,
    { rideId: payload.rideId, screen: "ride", status: payload.status },
  );
}

export async function notifyNoSeat(payload: {
  riderUserId: string;
  bookingId: string;
}) {
  getIO().to(payload.riderUserId).emit("booking.no_seat", {
    bookingId: payload.bookingId,
    message: "Sorry, no seats available. You will be refunded shortly.",
  });

  await sendPushToUser(
    payload.riderUserId,
    "No Seat Available 😕",
    "Sorry, no seats were available. You will be refunded shortly.",
    { bookingId: payload.bookingId, screen: "booking" },
  );
}

export async function notifyDriverApproved(payload: {
  userIdToNotify: string;
}) {
  getIO().to(payload.userIdToNotify).emit("driver.approved", {
    message:
      "Congratulations! Your driver application has been approved. Switch to driver mode to start offering rides.",
  });

  await sendPushToUser(
    payload.userIdToNotify,
    "Driver Application Approved! 🎉",
    "Congratulations! Switch to driver mode to start offering rides.",
    { screen: "profile" },
  );
}

export async function notifyDriverRejected(payload: {
  userIdToNotify: string;
  reason?: string;
}) {
  getIO()
    .to(payload.userIdToNotify)
    .emit("driver.rejected", {
      reason: payload.reason ?? null,
      message: "Your driver application was not approved. You may reapply.",
    });

  await sendPushToUser(
    payload.userIdToNotify,
    "Application Not Approved",
    payload.reason
      ? `Your application was not approved. Reason: ${payload.reason}`
      : "Your driver application was not approved. You may reapply.",
    { screen: "profile" },
  );
}

/**
 * Admin notifications
 * These emit to the "admins" room — all connected admin users receive them
 * No push notifications for admin — they use the web dashboard
 */
export function notifyAdminNewApplication(payload: {
  applicantName: string;
  userId: string;
}) {
  getIO()
    .to("admins")
    .emit("admin.new_application", {
      userId: payload.userId,
      applicantName: payload.applicantName,
      message: `${payload.applicantName} submitted a driver application.`,
    });
}

export function notifyAdminNewBooking(payload: {
  rideId: string;
  riderName: string;
  amount: number;
}) {
  getIO()
    .to("admins")
    .emit("admin.new_booking", {
      rideId: payload.rideId,
      riderName: payload.riderName,
      amount: payload.amount,
      message: `New booking by ${payload.riderName} — ₹${payload.amount}`,
    });
}

export function notifyAdminPaymentCompleted(payload: {
  rideId: string;
  riderName: string;
  amount: number;
}) {
  getIO()
    .to("admins")
    .emit("admin.payment_completed", {
      rideId: payload.rideId,
      riderName: payload.riderName,
      amount: payload.amount,
      message: `Payment of ₹${payload.amount} received from ${payload.riderName}`,
    });
}
