"use client";

import { useParams, useRouter } from "next/navigation";
import { useAdminRideDetail } from "@/hooks/useAdminRideDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/admin/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  MapPin,
  Star,
  Car,
  Calendar,
  Users,
  IndianRupee,
  Phone,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RideDetailPage() {
  const { rideId } = useParams<{ rideId: string }>();
  const router = useRouter();
  const { data: ride, isLoading } = useAdminRideDetail(rideId);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-40 bg-muted rounded animate-pulse" />
        <div className="h-60 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="p-8">
        <p className="text-foreground">Ride not found.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ride Detail</h1>
          <p className="text-muted-foreground text-sm">{ride.id}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={ride.status as any} />
        </div>
      </div>

      {/* Route + meta */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-success mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Origin</p>
                <p className="text-sm font-medium text-foreground">
                  {ride.origin_address}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-destructive mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Destination</p>
                <p className="text-sm font-medium text-foreground">
                  {ride.destination_address}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(ride.scheduled_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Seats</p>
                <p className="text-sm font-medium text-foreground">
                  {ride.seats_available}/{ride.seats_total}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Per seat</p>
                <p className="text-sm font-medium text-foreground">
                  ₹{ride.price_per_seat}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(ride.created_at)}
                </p>
              </div>
            </div>
          </div>

          {ride.status === "cancelled" && ride.cancelled_reason && (
            <>
              <Separator />
              <div className="bg-destructive/10 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  Cancellation reason
                </p>
                <p className="text-sm text-foreground mt-1">
                  {ride.cancelled_reason}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Driver + Vehicle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Driver</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium text-foreground">{ride.driver.name}</p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="w-3.5 h-3.5" />
              {ride.driver.phone}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Star className="w-3.5 h-3.5 fill-warning text-warning" />
              {ride.driver.rating.toFixed(2)} · {ride.driver.total_rides} rides
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm text-foreground">
              <Car className="w-3.5 h-3.5 text-muted-foreground" />
              {ride.vehicle.make} {ride.vehicle.model} ({ride.vehicle.year})
            </div>
            <p className="text-sm text-muted-foreground">
              {ride.vehicle.color} · {ride.vehicle.plate_number}
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              {ride.vehicle.vehicle_type}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">
            Bookings ({ride.bookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ride.bookings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No bookings yet for this ride.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rider</TableHead>
                  <TableHead>Pickup / Dropoff</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Confirmed</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ride.bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <p className="font-medium text-foreground text-sm">
                        {b.rider.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {b.rider.phone}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      <p className="text-foreground truncate max-w-[160px]">
                        {b.hop_in_address ?? "—"}
                      </p>
                      <p className="text-muted-foreground truncate max-w-[160px]">
                        {b.hop_off_address ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {b.seats_booked}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      ₹{b.total_amount}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(b.confirmed_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(b.paid_at)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={b.status as any} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
