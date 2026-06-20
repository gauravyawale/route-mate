"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import Sidebar from "@/components/admin/Sidebar";
import { useAdminSocket } from "@/hooks/useAdminSocket";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  useAdminSocket();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
