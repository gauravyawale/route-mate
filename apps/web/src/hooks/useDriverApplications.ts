import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DriverApplication {
  id: string;
  user_id: string;
  license_number: string;
  license_expiry: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  applicant?: {
    id: string;
    full_name: string;
    phone: string;
    avatar_url: string | null;
  };
}

// ─── Fetch pending applications ────────────────────────────
export function usePendingApplications() {
  return useQuery({
    queryKey: ["driver-applications", "pending"],
    queryFn: async () => {
      const res = await api.get<{ data: DriverApplication[] }>(
        "/api/v1/onboarding/admin/pending",
      );
      return res.data.data;
    },
  });
}

// ─── Approve driver ─────────────────────────────────────────
export function useApproveDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post(`/api/v1/onboarding/admin/${userId}/approve`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

// ─── Reject driver ───────────────────────────────────────────
export function useRejectDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      reason,
    }: {
      userId: string;
      reason?: string;
    }) => {
      const res = await api.post(`/api/v1/onboarding/admin/${userId}/reject`, {
        rejection_reason: reason,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}
