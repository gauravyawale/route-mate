"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import Sidebar from "@/components/admin/Sidebar";
import { initSocket, disconnectSocket } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useCurrentUser();
  const router = useRouter();
  const checked = useRef(false);
  const socketInitialized = useRef(false);
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<{
    checked: boolean;
    authed: boolean;
  }>({ checked: false, authed: false });

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    const authenticated = isAuthenticated();
    if (!authenticated) {
      router.replace("/login");
    }
    setAuthState({ checked: true, authed: authenticated });
  }, [router]);

  useEffect(() => {
    if (socketInitialized.current) return;
    if (!isAuthenticated()) return;
    socketInitialized.current = true;

    const socket = initSocket();

    socket.on("admin.new_application", (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["driver-applications"] });
      toast.info(data.message, {
        description: "Check Driver Applications for details.",
        action: {
          label: "View",
          onClick: () => router.push("/drivers"),
        },
      });
    });

    socket.on("admin.new_booking", (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.info(data.message);
    });

    socket.on("admin.payment_completed", (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(data.message);
    });

    socket.on("driver.approved", () => {
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["driver-applications"] });
    });

    return () => {
      disconnectSocket();
      socketInitialized.current = false;
    };
  }, [queryClient, router]);

  if (!authState.checked || !authState.authed) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
