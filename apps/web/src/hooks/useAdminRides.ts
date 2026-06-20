import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AdminRide {
  id: string;
  origin_address: string;
  destination_address: string;
  scheduled_at: string;
  seats_total: number;
  seats_available: number;
  price_per_seat: number;
  status: string;
  created_at: string;
  driver: {
    name: string;
    phone: string;
  };
  vehicle: {
    make: string;
    model: string;
    plate_number: string;
  };
  booking_count: number;
}

export function useAdminRides(status?: string) {
  return useQuery({
    queryKey: ["admin-rides", status],
    queryFn: async () => {
      const res = await api.get<{ data: AdminRide[] }>("/api/v1/admin/rides", {
        params: status ? { status } : {},
      });
      return res.data.data;
    },
  });
}
