import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AdminRideDetail {
  id: string;
  origin_address: string;
  destination_address: string;
  scheduled_at: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: string;
  cancelled_reason: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  driver: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    total_rides: number;
  };
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string;
    plate_number: string;
    vehicle_type: string;
  };
  bookings: Array<{
    id: string;
    status: string;
    seats_booked: number;
    total_amount: number;
    hop_in_address: string | null;
    hop_off_address: string | null;
    confirmed_at: string | null;
    paid_at: string | null;
    created_at: string;
    rider: {
      id: string;
      full_name: string;
      phone: string;
    };
  }>;
}

export function useAdminRideDetail(rideId: string) {
  return useQuery({
    queryKey: ["admin-ride-detail", rideId],
    queryFn: async () => {
      const res = await api.get<{ data: AdminRideDetail }>(
        `/api/v1/admin/rides/${rideId}`,
      );
      return res.data.data;
    },
    enabled: !!rideId,
  });
}
