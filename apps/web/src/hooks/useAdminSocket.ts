import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { initSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { isAuthenticated } from "@/lib/auth";

export function useAdminSocket() {
  const queryClient = useQueryClient();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (!isAuthenticated()) return;
    initialized.current = true;

    const socket = initSocket();

    socket.on(
      "admin.new_application",
      (data: {
        applicationId: string;
        applicantName: string;
        message: string;
      }) => {
        toast.info(data.message, {
          description: "New driver application received.",
        });

        // refetch pending applications and stats
        queryClient.invalidateQueries({ queryKey: ["driver-applications"] });
        queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      },
    );

    return () => {
      // don't disconnect on every unmount — only on logout
      // socket persists across page navigation within dashboard
    };
  }, [queryClient]);
}
