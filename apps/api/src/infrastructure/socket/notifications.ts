import { getIO } from "./index";

/**
 * This is the single place all Socket.io emissions live.
 * Services call this instead of calling getIO() directly — keeps socket logic out of business logic.
 */

/**
 * Booking Notifications
 */

export function notifyBookingRequested(payload: {
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
}

export function notifyBookingConfirmed(payload: {
  riderUserId: string;
  bookingId: string;
  rideId: string;
}) {
  getIO().to(payload.riderUserId).emit("booking.confirmed", {
    bookingId: payload.bookingId,
    rideId: payload.rideId,
    message: "Your booking is confirmed. Complete payment to secure your seat.",
  });
}

export function notifyBookingCancelled(payload: {
  userId: string; // whoever needs to be notified
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
}

export function notifyPaymentCompleted(payload: {
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
}

export function notifyRideStatusChanged(payload: {
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
}

export function notifyNoSeat(payload: {
  riderUserId: string;
  bookingId: string;
}) {
  getIO().to(payload.riderUserId).emit("booking.no_seat", {
    bookingId: payload.bookingId,
    message: "Sorry, no seats available. You will be refunded shortly.",
  });
}

export function notifyDriverApproved(payload: { userIdToNotify: string }) {
  getIO().to(payload.userIdToNotify).emit("driver.approved", {
    message:
      "Congratulations! Your driver application has been approved. Switch to driver mode to start offering rides.",
  });
}

export function notifyDriverRejected(payload: {
  userIdToNotify: string;
  reason?: string;
}) {
  getIO()
    .to(payload.userIdToNotify)
    .emit("driver.rejected", {
      reason: payload.reason ?? null,
      message: "Your driver application was not approved. You may reapply.",
    });
}

export function notifyAdminNewApplication(payload: {
  applicantName: string;
  applicationId: string;
}) {
  // broadcast to all connected admins
  // we use a dedicated "admins" room instead of per-user room
  getIO()
    .to("admins")
    .emit("admin.new_application", {
      applicationId: payload.applicationId,
      applicantName: payload.applicantName,
      message: `${payload.applicantName} applied to become a driver.`,
    });
}
