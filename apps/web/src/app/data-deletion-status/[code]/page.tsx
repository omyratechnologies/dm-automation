import { Metadata } from "next";
import { notFound } from "next/navigation";
import { API_URL } from "@/lib/api";

export const metadata: Metadata = {
  title: "Data Deletion Status | DM Automation",
  description: "Check the status of your data deletion request",
};

interface Props {
  params: Promise<{
    code: string;
  }>;
}

interface DeletionStatus {
  confirmationCode: string;
  status: string;
  requestedAt: string;
  completedAt: string | null;
}

async function loadDeletionStatus(code: string): Promise<DeletionStatus> {
  const response = await fetch(
    `${API_URL}/v1/webhooks/meta/data-deletion/${encodeURIComponent(code)}`,
    { cache: "no-store" },
  );
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("Unable to load deletion request status");
  return response.json() as Promise<DeletionStatus>;
}

export default async function DataDeletionStatusPage({ params }: Props) {
  const { code } = await params;
  const request = await loadDeletionStatus(code);
  const isCompleted = request.status === "completed";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-card rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Data Deletion Request</h1>
          <p className="text-muted-foreground">
            Confirmation Code: <code className="bg-muted px-2 py-1 rounded">{request.confirmationCode}</code>
          </p>
        </div>

        <div className="space-y-6">
          <div className={isCompleted
            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
            : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"}
          >
            <h2 className={isCompleted
              ? "text-lg font-semibold text-green-800 dark:text-green-400 mb-2"
              : "text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2"}
            >
              Request {request.status}
            </h2>
            <p className={isCompleted
              ? "text-green-700 dark:text-green-300"
              : "text-yellow-700 dark:text-yellow-300"}
            >
              {isCompleted
                ? "The Instagram data associated with this confirmation code has been removed from our active systems."
                : "This deletion request is still being processed. Please check again later."}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">What happens next?</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Your Instagram/Facebook integration data will be permanently deleted</li>
              <li>All associated automation workflows will be removed</li>
              <li>Your messages and conversation history will be deleted</li>
              <li>The confirmation record does not retain your Meta user ID</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Need help?</h3>
            <p className="text-muted-foreground">
              If you have questions about your data deletion request, please contact us at{" "}
              <a
                href="mailto:support@gemai.in"
                className="text-primary hover:underline"
              >
                support@gemai.in
              </a>
            </p>
          </div>

          <div className="pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              For more information about how we handle your data, please review our{" "}
              <a href="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </a>{" "}
              and{" "}
              <a href="/gdpr" className="text-primary hover:underline">
                GDPR Compliance
              </a>{" "}
              pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
