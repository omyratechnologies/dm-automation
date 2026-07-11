import React from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWebhookEventsList } from "@/actions/admin";
import AdminWebhooksClient from "./_components/webhooks-client";

export default async function AdminWebhooksPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Server prefetch first page of webhooks
  const result = await getWebhookEventsList(1, 15);
  const initialData = result.status === 200 ? result.data : { items: [], total: 0 };

  return (
    <div className="flex flex-col gap-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Webhook Events Telemetry</h1>
        <p className="text-muted-foreground text-sm">
          Inspect Meta webhook handshakes, debug execution failures, examine raw request payloads, and retry failed delivery events.
        </p>
      </div>

      <AdminWebhooksClient initialData={initialData} />
    </div>
  );
}
