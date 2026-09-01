"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface InvestorUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  verified: boolean;
  createdAt: string;
}

export function InvestorVerificationTable() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<InvestorUser[]>({
    queryKey: ["investor-users"],
    queryFn: async () => {
      const res = await fetch("/api/users/investors");
      if (!res.ok) return [];
      return (await res.json()).users;
    },
  });

  const { mutate: toggleVerify, isPending } = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const res = await fetch(`/api/users/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified }),
      });
      if (!res.ok) throw new Error("Unable to update verification.");
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.verified ? "Investor verified." : "Verification revoked.");
      queryClient.invalidateQueries({ queryKey: ["investor-users"] });
    },
    onError: () => toast.error("Unable to update verification."),
  });

  if (isLoading) {
    return (
      <div className="card-elevated space-y-3 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No accounts awaiting verification"
        description="Marketplace, seller, and project-owner accounts that need KYC before acting as buyers will appear here."
      />
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {users.map((u) => (
          <article key={u.id} className="card-elevated space-y-3 p-4">
            <div>
              <p className="font-medium text-foreground">{u.name || u.email}</p>
              {u.name ? <p className="text-xs text-muted-foreground">{u.email}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{u.role}</Badge>
              <Badge variant={u.verified ? "success" : "warning"}>
                {u.verified ? "Verified" : "Pending"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Joined {new Date(u.createdAt).toLocaleDateString()}
              </span>
            </div>
            <Button
              variant={u.verified ? "outline" : "sky"}
              size="sm"
              className="w-full"
              disabled={isPending}
              onClick={() => toggleVerify({ id: u.id, verified: !u.verified })}
            >
              {u.verified ? "Revoke" : "Verify"}
            </Button>
          </article>
        ))}
      </div>
      <div className="card-elevated hidden overflow-hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Investor</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="whitespace-normal">
                <div className="font-medium text-foreground">{u.name || u.email}</div>
                {u.name && <div className="text-xs text-muted-foreground">{u.email}</div>}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{u.role}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={u.verified ? "success" : "warning"}>
                  {u.verified ? "Verified" : "Pending"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(u.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant={u.verified ? "outline" : "sky"}
                  size="sm"
                  disabled={isPending}
                  onClick={() => toggleVerify({ id: u.id, verified: !u.verified })}
                >
                  {u.verified ? "Revoke" : "Verify"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </>
  );
}
