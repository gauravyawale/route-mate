"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminRides } from "@/hooks/useAdminRides";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/admin/StatusBadge";
import { Car, MapPin, Users } from "lucide-react";

const statusFilters = [
  { label: "All", value: "" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function RidesPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data: rides, isLoading } = useAdminRides(statusFilter || undefined);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rides</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View and monitor all rides on the platform.
        </p>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="flex gap-2">
          {statusFilters.map((f) => (
            <TabsTrigger
              key={f.value}
              value={f.value}
              className="cursor-pointer"
            >
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : rides?.length === 0 ? (
            <div className="p-12 text-center">
              <Car className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">No rides found</p>
              <p className="text-muted-foreground text-sm mt-1">
                Try a different filter.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rides?.map((ride) => (
                  <TableRow
                    key={ride.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      <Link href={`/rides/${ride.id}`} className="block">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium text-foreground truncate max-w-[160px]">
                            {ride.origin_address}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-1">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground truncate max-w-[160px]">
                            {ride.destination_address}
                          </span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/rides/${ride.id}`} className="block">
                        <p className="font-medium text-foreground text-sm">
                          {ride.driver.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ride.driver.phone}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/rides/${ride.id}`}
                        className="block text-sm"
                      >
                        <p className="text-foreground">
                          {ride.vehicle.make} {ride.vehicle.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ride.vehicle.plate_number}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/rides/${ride.id}`}
                        className="block text-sm text-foreground"
                      >
                        {new Date(ride.scheduled_at).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/rides/${ride.id}`}
                        className="flex items-center gap-1.5 text-sm text-foreground"
                      >
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        {ride.seats_available}/{ride.seats_total}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/rides/${ride.id}`}
                        className="block text-sm text-foreground"
                      >
                        {ride.booking_count}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/rides/${ride.id}`} className="block">
                        <StatusBadge status={ride.status as any} />
                      </Link>
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
