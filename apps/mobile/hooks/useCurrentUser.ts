import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { getAccessToken, clearTokens } from "../lib/auth";
import { router } from "expo-router";

export function useCurrentUser() {
  const { user } = useAuthStore();
  const [hasToken, setHasToken] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    getAccessToken().then((token) => {
      setHasToken(!!token);
      setChecked(true);
    });
  }, []);

  const { data, isError } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const res = await api.get("/api/v1/users/me");
      return res.data.data;
    },
    enabled: checked && hasToken && !user,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (data && !user) {
      useAuthStore.setState({ user: data, isAuthenticated: true });
    }
  }, [data, user]);

  useEffect(() => {
    if (isError && checked) {
      // token exists but API call failed — clear and redirect to login
      clearTokens().then(() => {
        useAuthStore.setState({ user: null, isAuthenticated: false });
        router.replace("/(auth)/login");
      });
    }
  }, [isError, checked]);

  return user;
}
