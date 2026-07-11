import React from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAdminUsers } from "@/actions/admin";
import AdminUsersClient from "./_components/users-client";

export default async function AdminUsersPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Server prefetch first page of users
  const result = await getAdminUsers(1, 10, "");
  const initialData = result.status === 200 ? result.data : { items: [], total: 0 };

  return (
    <div className="flex flex-col gap-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">User & Tenant Management</h1>
        <p className="text-muted-foreground text-sm">
          Inspect platform registration profiles, workspaces, connected Instagram accounts, override subscription limits, and trigger support impersonations.
        </p>
      </div>

      <AdminUsersClient initialData={initialData} />
    </div>
  );
}
