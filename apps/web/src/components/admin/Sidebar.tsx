"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Car,
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import ThemeToggle from "./ThemeToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

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
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully.");
    router.push("/login");
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "min-h-screen flex flex-col transition-all duration-200",
          collapsed ? "w-20" : "w-64",
        )}
        style={{
          backgroundColor: "hsl(var(--sidebar))",
          borderRight: "1px solid hsl(var(--sidebar-border))",
        }}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 relative">
              <Image
                src="/icon.png"
                alt="Route Mate"
                fill
                className="object-cover"
              />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p
                  className="font-semibold text-sm truncate"
                  style={{ color: "hsl(var(--sidebar-foreground))" }}
                >
                  Route Mate
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: "hsl(var(--sidebar-muted-foreground))" }}
                >
                  Admin Portal
                </p>
              </div>
            )}
          </div>
          {!collapsed && <ThemeToggle />}
        </div>

        <Separator style={{ backgroundColor: "hsl(var(--sidebar-border))" }} />

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  collapsed && "justify-center px-2",
                )}
                style={{
                  backgroundColor: isActive
                    ? "hsl(var(--sidebar-active))"
                    : "transparent",
                  color: isActive
                    ? "hsl(var(--foreground))"
                    : "hsl(var(--sidebar-muted-foreground))",
                }}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && item.label}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        <Separator style={{ backgroundColor: "hsl(var(--sidebar-border))" }} />

        {/* Collapse toggle */}
        <div className="p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center gap-2"
            style={{ color: "hsl(var(--sidebar-muted-foreground))" }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        </div>

        <Separator style={{ backgroundColor: "hsl(var(--sidebar-border))" }} />

        {/* User + logout */}
        <div className="p-3 space-y-3">
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed && "justify-center",
            )}
          >
            <Avatar className="w-8 h-8 flex-shrink-0">
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
            {!collapsed && (
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
            )}
          </div>

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full"
                  style={{ color: "hsl(var(--sidebar-muted-foreground))" }}
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              style={{ color: "hsl(var(--sidebar-muted-foreground))" }}
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
