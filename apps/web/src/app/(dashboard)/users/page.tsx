"use client";

import { useState } from "react";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Star, ShieldCheck, Users as UsersIcon } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const { data: users, isLoading } = useAdminUsers(
    debouncedSearch || undefined,
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">
          All registered users on the platform.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : users?.length === 0 ? (
            <div className="p-12 text-center">
              <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">No users found</p>
              <p className="text-muted-foreground text-sm mt-1">
                Try a different search term.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>No-shows</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                            {u.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {u.full_name || "Unnamed"}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {u.role === "admin" && (
                              <Badge
                                variant="secondary"
                                className="text-xs gap-1"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                Admin
                              </Badge>
                            )}
                            {u.is_verified && (
                              <span className="text-xs text-success">
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {u.phone}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {u.active_mode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.is_driver_approved ? (
                        <div className="flex items-center gap-1.5 text-foreground">
                          <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                          {u.driver_rating?.toFixed(2)} · {u.driver_total_rides}{" "}
                          rides
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.no_show_count > 0 ? (
                        <span className="text-destructive font-medium">
                          {u.no_show_count}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(u.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
