"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  // initialize socket and listen for admin events
  useEffect(() => {
    if (socketInitialized.current) return;
    if (!isAuthenticated()) return;
    socketInitialized.current = true;

    const socket = initSocket();

    // new driver application — refresh stats + applications list
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

    // new booking — refresh stats
    socket.on("admin.new_booking", (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.info(data.message);
    });

    // payment completed — refresh stats
    socket.on("admin.payment_completed", (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(data.message);
    });

    // driver approved notification (confirmation to admin)
    socket.on("driver.approved", () => {
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["driver-applications"] });
    });

    return () => {
      disconnectSocket();
      socketInitialized.current = false;
    };
  }, [queryClient, router]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
