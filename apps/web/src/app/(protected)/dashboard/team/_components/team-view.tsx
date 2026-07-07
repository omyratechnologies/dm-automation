"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import type { Billing, Member } from "@/lib/api";
import { useWorkspace } from "@/providers/workspace-provider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Sparkles, Trash2, UserPlus } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const memberName = (m: Member) =>
  [m.user.firstname, m.user.lastname].filter(Boolean).join(" ") || m.user.email;

const memberInitials = (m: Member) => {
  const name = memberName(m);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const UsageBar = ({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) => {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">
          {used.toLocaleString()} / {limit > 0 ? limit.toLocaleString() : "∞"}
        </span>
      </div>
      <Progress
        value={pct}
        className={pct >= 90 ? "[&>div]:bg-red-500" : "[&>div]:bg-gradient-to-r [&>div]:from-[#3352CC] [&>div]:to-[#1C2D70]"}
      />
    </div>
  );
};

const TeamView = () => {
  const { api, wsPath, workspaceId } = useApi();
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "AGENT">("AGENT");

  const canManage =
    workspace?.role === "OWNER" || workspace?.role === "ADMIN";
  const orgId = workspace?.orgId ?? null;

  const membersQuery = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => api<Member[]>(wsPath("/members")),
    enabled: !!workspaceId,
  });

  const billingQuery = useQuery({
    queryKey: ["billing", orgId],
    queryFn: () => api<Billing>(`/orgs/${orgId}/billing`),
    enabled: !!orgId,
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      api(wsPath("/members"), {
        method: "POST",
        body: { email: inviteEmail.trim(), role: inviteRole },
      }),
    onSuccess: () => {
      toast.success("Member invited");
      queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("AGENT");
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to invite member"
      ),
  });

  const roleMutation = useMutation({
    mutationFn: ({
      membershipId,
      role,
    }: {
      membershipId: string;
      role: "ADMIN" | "AGENT";
    }) =>
      api(wsPath(`/members/${membershipId}`), {
        method: "PATCH",
        body: { role },
      }),
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to update role"
      ),
  });

  const removeMutation = useMutation({
    mutationFn: (membershipId: string) =>
      api(wsPath(`/members/${membershipId}`), { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Member removed");
      queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to remove member"
      ),
  });

  const checkoutMutation = useMutation({
    mutationFn: () =>
      api<{ url: string }>(`/orgs/${orgId}/billing/checkout`, {
        method: "POST",
        body: {
          successUrl: window.location.href,
          cancelUrl: window.location.href,
        },
      }),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to start checkout"
      ),
  });

  const billing = billingQuery.data;
  const sendsLimit =
    billing?.limits?.sends ?? billing?.limits?.monthlySends ?? 0;
  const contactsLimit = billing?.limits?.contacts ?? 0;
  const isPro = (billing?.plan ?? workspace?.plan) === "PRO";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Members */}
      <div className="xl:col-span-2 rounded-2xl bg-card border border-border overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Members</h2>
            <p className="text-xs text-muted-foreground">
              People with access to this workspace.
            </p>
          </div>
          {canManage && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-[#3352CC] to-[#1C2D70] text-white hover:opacity-90"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite a member</DialogTitle>
                  <DialogDescription>
                    They must already have an account with this email.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="teammate@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={inviteRole}
                      onValueChange={(v) =>
                        setInviteRole(v as "ADMIN" | "AGENT")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="AGENT">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => inviteMutation.mutate()}
                    disabled={
                      !inviteEmail.trim().includes("@") ||
                      inviteMutation.isPending
                    }
                    className="bg-gradient-to-r from-[#3352CC] to-[#1C2D70] text-white hover:opacity-90"
                  >
                    {inviteMutation.isPending ? "Inviting…" : "Send invite"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {membersQuery.isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                {canManage && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(membersQuery.data ?? []).map((m) => (
                <TableRow key={m.id} className="hover:bg-accent/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-gradient-to-br from-[#3352CC] to-[#1C2D70] text-white text-xs font-semibold">
                          {memberInitials(m)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {memberName(m)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {m.user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {m.role === "OWNER" || !canManage ? (
                      <Badge
                        variant="outline"
                        className="capitalize text-[11px]"
                      >
                        {m.role.toLowerCase()}
                      </Badge>
                    ) : (
                      <Select
                        value={m.role}
                        onValueChange={(role) =>
                          roleMutation.mutate({
                            membershipId: m.id,
                            role: role as "ADMIN" | "AGENT",
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-[110px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="AGENT">Agent</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      {m.role !== "OWNER" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                          disabled={removeMutation.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove ${memberName(m)} from this workspace?`
                              )
                            ) {
                              removeMutation.mutate(m.id);
                            }
                          }}
                          aria-label={`Remove ${memberName(m)}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Billing */}
      <div className="rounded-2xl bg-card border border-border p-5 h-fit flex flex-col gap-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3352CC] to-[#1C2D70]">
              <CreditCard className="h-5 w-5 text-white" />
            </span>
            <h2 className="text-lg font-bold text-foreground">Billing</h2>
          </div>
          {billingQuery.isLoading ? (
            <Skeleton className="h-6 w-14 rounded-full" />
          ) : (
            <Badge
              className={
                isPro
                  ? "bg-gradient-to-r from-[#3352CC] to-[#1C2D70] text-white hover:from-[#3352CC] hover:to-[#1C2D70]"
                  : "bg-muted text-muted-foreground hover:bg-muted"
              }
            >
              {(billing?.plan ?? workspace?.plan ?? "FREE").toUpperCase()}
            </Badge>
          )}
        </div>

        {billingQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : billing ? (
          <div className="space-y-4">
            <UsageBar
              label="Monthly sends"
              used={billing.usage?.sends ?? 0}
              limit={sendsLimit}
            />
            <UsageBar
              label="Contacts"
              used={billing.usage?.contacts ?? 0}
              limit={contactsLimit}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Billing information unavailable.
          </p>
        )}

        {!isPro && (
          <Button
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending || !orgId}
            className="w-full bg-gradient-to-r from-[#3352CC] to-[#1C2D70] text-white hover:opacity-90"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {checkoutMutation.isPending ? "Redirecting…" : "Upgrade to Pro"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default TeamView;
