"use client";

import React, { useState, useTransition, useEffect } from "react";
import { 
  getAdminUsers, 
  getAdminUserDetails, 
  overrideOrgSubscription,
  startImpersonating
} from "@/actions/admin";
import type { AdminUserListItem, AdminUserDetails } from "@/actions/admin";
import { 
  Search, 
  User, 
  Building, 
  Activity, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  X,
  CreditCard,
  Instagram,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  initialData: { items: AdminUserListItem[]; total: number };
};

export default function AdminUsersClient({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetails | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDetailPending, startDetailTransition] = useTransition();
  const [isActionPending, startActionTransition] = useTransition();

  // Search/Page transition
  const fetchUsers = (pageNum: number, searchVal: string) => {
    startTransition(async () => {
      const res = await getAdminUsers(pageNum, 10, searchVal);
      if (res.status === 200) {
        setData(res.data);
      }
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    fetchUsers(1, val);
  };

  const handlePageChange = (direction: "prev" | "next") => {
    const newPage = direction === "prev" ? page - 1 : page + 1;
    setPage(newPage);
    fetchUsers(newPage, search);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    startDetailTransition(async () => {
      const res = await getAdminUserDetails(userId);
      if (res.status === 200) {
        setSelectedUser(res.data);
      } else {
        toast.error("Failed to load user details");
        setSelectedUserId(null);
      }
    });
  };

  const handleOverrideSubscription = (orgId: string, currentPlan: "FREE" | "PRO") => {
    const newPlan = currentPlan === "FREE" ? "PRO" : "FREE";
    startActionTransition(async () => {
      const res = await overrideOrgSubscription(orgId, newPlan);
      if (res.status === 200) {
        toast.success(`Plan updated to ${newPlan} successfully`);
        // Refresh details
        if (selectedUserId) {
          const detailRes = await getAdminUserDetails(selectedUserId);
          if (detailRes.status === 200) {
            setSelectedUser(detailRes.data);
          }
        }
        // Refresh list
        fetchUsers(page, search);
      } else {
        toast.error("Failed to update plan");
      }
    });
  };

  const handleImpersonate = (userId: string) => {
    startActionTransition(async () => {
      const res = await startImpersonating(userId);
      if (res.status === 200) {
        toast.success("Impersonation session started!");
        // Redirect to dashboard as target user
        window.location.href = "/dashboard";
      } else {
        toast.error("Failed to start impersonation. Ensure SUPPORT_IMPERSONATION_ENABLED is true.");
      }
    });
  };

  const totalPages = Math.ceil(data.total / 10);

  return (
    <div className="flex gap-x-6 relative min-h-[500px]">
      {/* Users Grid/List */}
      <div className="flex-1 flex flex-col gap-y-4">
        {/* Search Bar */}
        <div className="flex items-center gap-x-3 bg-card border border-border px-4 py-2.5 rounded-xl hover:border-primary/40 transition-colors">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users by name, email or clerkId..."
            value={search}
            onChange={handleSearchChange}
            className="bg-transparent border-none outline-none text-foreground w-full text-sm placeholder:text-muted-foreground"
          />
        </div>

        {/* Table */}
        <div className="border border-border bg-card/50 rounded-2xl overflow-hidden shadow-sm">
          {isPending ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : data.items.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No users found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4">User</th>
                    <th className="p-4">Clerk ID</th>
                    <th className="p-4">Workspaces / Plan</th>
                    <th className="p-4">Registered At</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleSelectUser(item.id)}
                      className={cn(
                        "border-b border-border/60 hover:bg-muted/30 transition-colors cursor-pointer",
                        selectedUserId === item.id && "bg-primary/5 hover:bg-primary/5"
                      )}
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {item.firstname} {item.lastname || ""}
                          </span>
                          <span className="text-xs text-muted-foreground">{item.email}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-muted-foreground">
                        {item.clerkId}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-y-1">
                          {item.memberships.map((m, idx) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center gap-x-1.5 text-xs text-muted-foreground"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              {m.workspace.name} ({m.workspace.organization.plan})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border p-4 bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages} ({data.total} total users)
              </span>
              <div className="flex gap-x-2">
                <button
                  onClick={() => handlePageChange("prev")}
                  disabled={page === 1 || isPending}
                  className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePageChange("next")}
                  disabled={page === totalPages || isPending}
                  className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Overlay Drawer */}
      {selectedUserId && (
        <div className="w-[450px] border border-border bg-card rounded-2xl p-6 shadow-2xl flex flex-col gap-y-6 animate-slide-in">
          {/* Drawer Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-x-2">
              <User className="h-5 w-5 text-primary" />
              User Details
            </h2>
            <button
              onClick={() => {
                setSelectedUserId(null);
                setSelectedUser(null);
              }}
              className="p-1 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isDetailPending ? (
            <div className="flex-1 flex justify-center items-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : selectedUser ? (
            <div className="flex flex-col gap-y-6 overflow-y-auto max-h-[700px] pr-2">
              {/* Profile Card */}
              <div className="bg-muted/40 p-4 border border-border rounded-xl">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                  Basic Info
                </p>
                <div className="mt-3 flex flex-col gap-y-1.5 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name: </span>
                    <span className="font-medium">{selectedUser.firstname} {selectedUser.lastname || ""}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    <span className="font-medium font-mono text-xs">{selectedUser.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ID: </span>
                    <span className="font-medium font-mono text-xs">{selectedUser.id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clerk ID: </span>
                    <span className="font-medium font-mono text-xs">{selectedUser.clerkId}</span>
                  </div>
                </div>
              </div>

              {/* Workspaces & Accounts */}
              <div className="flex flex-col gap-y-3">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider flex items-center gap-x-2">
                  <Building className="h-4 w-4" />
                  Workspaces & IG Accounts
                </p>

                {selectedUser.memberships.map((m) => (
                  <div 
                    key={m.id}
                    className="p-4 border border-border/80 rounded-xl bg-card hover:border-primary/20 transition-all flex flex-col gap-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{m.workspace.name}</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full border font-semibold uppercase",
                        m.workspace.organization.plan === "PRO" 
                          ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                          : "bg-muted border-border text-muted-foreground"
                      )}>
                        {m.workspace.organization.plan} Plan
                      </span>
                    </div>

                    {/* Instagram Accounts */}
                    <div className="flex flex-col gap-y-2 mt-1">
                      <p className="text-xs text-muted-foreground font-medium">Linked IG Profiles:</p>
                      {m.workspace.igAccounts.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No connected Instagram accounts</p>
                      ) : (
                        m.workspace.igAccounts.map((acc) => (
                          <div 
                            key={acc.id} 
                            className="flex items-center justify-between p-2.5 bg-muted/20 border border-border rounded-lg"
                          >
                            <span className="text-xs font-semibold flex items-center gap-x-1.5">
                              <Instagram className="h-3.5 w-3.5 text-pink-400" />
                              @{acc.username || acc.igUserId}
                            </span>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.2 rounded-md font-bold uppercase",
                              acc.status === "ACTIVE" 
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            )}>
                              {acc.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Quick Overrides */}
                    <div className="mt-3 border-t border-border pt-3 flex gap-x-2">
                      <button
                        onClick={() => handleOverrideSubscription(m.workspace.organization.id, m.workspace.organization.plan as any)}
                        disabled={isActionPending}
                        className="flex items-center justify-center gap-x-1.5 px-3 py-1.5 rounded-lg border border-primary/20 text-xs font-semibold text-primary hover:bg-primary/5 transition-all cursor-pointer disabled:opacity-50 flex-1"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        Toggle PRO Limit
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Impersonation Actions */}
              <div className="border-t border-border pt-4 mt-2">
                <button
                  onClick={() => handleImpersonate(selectedUser.id)}
                  disabled={isActionPending}
                  className="flex items-center justify-center gap-x-2 w-full px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 transition-colors text-black font-bold text-sm cursor-pointer disabled:opacity-50"
                >
                  {isActionPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                  ) : (
                    <UserCheck className="h-4.5 w-4.5" />
                  )}
                  Impersonate Support Session
                </button>
                <p className="text-[11px] text-muted-foreground mt-2 text-center leading-relaxed">
                  Generates an administrative cookie session to view and control the platform as this tenant. Impersonation events are audited under admin logs.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              Select a user to inspect.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
