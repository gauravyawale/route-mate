"use client";

import {
  UserCheck,
  Users,
  Car,
  CheckCircle2,
  IndianRupee,
  Activity,
} from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminStats";
import StatCard from "@/components/admin/StatCard";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of Route Mate platform activity
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Pending Applications"
          value={stats?.pending_applications ?? 0}
          icon={UserCheck}
          accent="warning"
          loading={isLoading}
        />
        <StatCard
          label="Total Users"
          value={stats?.total_users ?? 0}
          icon={Users}
          accent="primary"
          loading={isLoading}
        />
        <StatCard
          label="Total Drivers"
          value={stats?.total_drivers ?? 0}
          icon={Car}
          accent="primary"
          loading={isLoading}
        />
        <StatCard
          label="Active Rides"
          value={stats?.active_rides ?? 0}
          icon={Activity}
          accent="success"
          loading={isLoading}
        />
        <StatCard
          label="Completed Rides"
          value={stats?.completed_rides ?? 0}
          icon={CheckCircle2}
          accent="success"
          loading={isLoading}
        />
        <StatCard
          label="Total Revenue"
          value={`₹${(stats?.total_revenue ?? 0).toLocaleString("en-IN")}`}
          icon={IndianRupee}
          accent="primary"
          loading={isLoading}
        />
      </div>

      {/* Quick actions */}
      {!isLoading && (stats?.pending_applications ?? 0) > 0 && (
        <Card
          className="border-none shadow-sm"
          style={{ backgroundColor: "hsl(var(--sidebar-active))" }}
        >
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">
                {stats?.pending_applications} driver application
                {stats?.pending_applications === 1 ? "" : "s"} awaiting review
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Review and approve or reject pending driver applications.
              </p>
            </div>
            <Link href="/drivers">
              <Button>
                Review Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
