"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  usePendingApplications,
  useApproveDriver,
  useRejectDriver,
  type DriverApplication,
} from "@/hooks/useDriverApplications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, XCircle, FileText, Phone, Calendar } from "lucide-react";
import RejectDialog from "@/components/admin/RejectDialog";

export default function DriverApplicationsPage() {
  const { data: applications, isLoading } = usePendingApplications();
  const approveDriver = useApproveDriver();
  const rejectDriver = useRejectDriver();

  const [rejectTarget, setRejectTarget] = useState<DriverApplication | null>(
    null,
  );

  const handleApprove = async (app: DriverApplication) => {
    try {
      await approveDriver.mutateAsync(app.user_id);
      toast.success(
        `${app.applicant?.full_name ?? "Driver"} approved successfully.`,
      );
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ?? "Failed to approve driver.",
      );
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    try {
      await rejectDriver.mutateAsync({
        userId: rejectTarget.user_id,
        reason,
      });
      toast.success(
        `${rejectTarget.applicant?.full_name ?? "Application"} rejected.`,
      );
      setRejectTarget(null);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ?? "Failed to reject application.",
      );
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Driver Applications
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review pending driver applications and approve or reject them.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && applications?.length === 0 && (
        <Card className="border-none shadow-sm">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium">
              No pending applications
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              New driver applications will appear here for review.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading &&
        applications?.map((app) => (
          <Card key={app.id} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/15 text-primary font-semibold">
                      {app.applicant?.full_name?.charAt(0)?.toUpperCase() ??
                        "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      {app.applicant?.full_name || "Unnamed User"}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />
                      {app.applicant?.phone}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <FileText className="w-3.5 h-3.5" />
                      License: {app.license_number}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      Expires:{" "}
                      {new Date(app.license_expiry).toLocaleDateString(
                        "en-IN",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      Applied{" "}
                      {new Date(app.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setRejectTarget(app)}
                    disabled={approveDriver.isPending}
                    className="gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(app)}
                    disabled={approveDriver.isPending}
                    className="gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {approveDriver.isPending ? "Approving..." : "Approve"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

      <RejectDialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        onConfirm={handleReject}
        isLoading={rejectDriver.isPending}
        applicantName={rejectTarget?.applicant?.full_name ?? "this applicant"}
      />
    </div>
  );
}
