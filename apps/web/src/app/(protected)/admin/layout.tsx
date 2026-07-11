import React from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/sidebar";
import InfoBar from "@/components/global/InfoBar";

type Props = {
  children: React.ReactNode;
};

async function AdminLayout({ children }: Props) {
  const user = await currentUser();
  const role = user?.publicMetadata?.role;

  // Protect all subroutes, redirect unauthorized users
  if (role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="p-4">
      <AdminSidebar />
      <div
        className="
      lg:ml-[280px] 
      lg:pl-12 
      lg:py-6 
      flex 
      flex-col 
      overflow-auto
      "
      >
        <InfoBar />
        <div className="pt-4">{children}</div>
      </div>
    </div>
  );
}

export default AdminLayout;
