"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Car, UserCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Driver Applications", href: "/drivers", icon: UserCheck },
  { label: "Rides", href: "/rides", icon: Car },
  { label: "Users", href: "/users", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully.");
    router.push("/login");
  };

  return (
    <aside
      className="w-64 min-h-screen flex flex-col"
      style={{
        backgroundColor: "hsl(var(--sidebar))",
        borderRight: "1px solid hsl(var(--sidebar-border))",
      }}
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "hsl(var(--sidebar-accent))" }}
          >
            <span
              style={{ color: "hsl(var(--foreground))" }}
              className="text-sm font-bold"
            >
              R
            </span>
          </div>
          <div>
            <p
              className="font-semibold text-sm"
              style={{ color: "hsl(var(--sidebar-foreground))" }}
            >
              Route Mate
            </p>
            <p
              className="text-xs"
              style={{ color: "hsl(var(--sidebar-muted-foreground))" }}
            >
              Admin Portal
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <Separator style={{ backgroundColor: "hsl(var(--sidebar-border))" }} />

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              )}
              style={{
                backgroundColor: isActive
                  ? "hsl(var(--sidebar-active))"
                  : "transparent",
                color: isActive
                  ? "hsl(var(--foreground))" // changed from "white"
                  : "hsl(var(--sidebar-muted-foreground))",
              }}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator style={{ backgroundColor: "hsl(var(--sidebar-border))" }} />

      {/* User + logout */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback
              style={{
                backgroundColor: "hsl(var(--sidebar-muted))",
                color: "hsl(var(--sidebar-foreground))",
              }}
              className="text-xs"
            >
              {user?.full_name?.charAt(0)?.toUpperCase() ?? "A"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: "hsl(var(--sidebar-foreground))" }}
            >
              {user?.full_name ?? "Admin"}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: "hsl(var(--sidebar-muted-foreground))" }}
            >
              {user?.phone}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          style={{ color: "hsl(var(--sidebar-muted-foreground))" }}
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
