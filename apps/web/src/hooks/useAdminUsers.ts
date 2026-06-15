import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AdminUser {
  id: string;
  phone: string;
  email: string | null;
  full_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_driver_approved: boolean;
  active_mode: string;
  no_show_count: number;
  role: string;
  created_at: string;
  driver_rating: number | null;
  driver_total_rides: number | null;
}

export function useAdminUsers(search?: string) {
  return useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => {
      const res = await api.get<{ data: AdminUser[] }>("/api/v1/admin/users", {
        params: search ? { search } : {},
      });
      return res.data.data;
    },
  });
}
