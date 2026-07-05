import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { isAuthenticated } from "../lib/auth";

export function useCurrentUser() {
  const { user } = useAuthStore();

  const { data } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const res = await api.get("/api/v1/users/me");
      return res.data.data;
    },
    enabled: !user,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data && !user) {
      useAuthStore.setState({ user: data, isAuthenticated: true });
    }
  }, [data, user]);

  return user;
}
