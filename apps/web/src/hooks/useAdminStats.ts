import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AdminStats {
  pending_applications: number;
  total_users: number;
  total_drivers: number;
  active_rides: number;
  completed_rides: number;
  total_revenue: number;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await api.get<{ data: AdminStats }>("/api/v1/admin/stats");
      return res.data.data;
    },
    refetchInterval: 30000, // refresh every 30s — admin wants fresh numbers
  });
}
