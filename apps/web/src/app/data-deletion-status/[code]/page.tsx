import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion Status | DM Automation",
  description: "Check the status of your data deletion request",
};

interface Props {
  params: {
    code: string;
  };
}

export default function DataDeletionStatusPage({ params }: Props) {
  const { code } = params;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-card rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Data Deletion Request</h1>
          <p className="text-muted-foreground">
            Confirmation Code: <code className="bg-muted px-2 py-1 rounded">{code}</code>
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">
              ✅ Request Received
            </h2>
            <p className="text-green-700 dark:text-green-300">
              Your data deletion request has been received and is being processed.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">What happens next?</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Your Instagram/Facebook integration data will be permanently deleted</li>
              <li>All associated automation workflows will be removed</li>
              <li>Your messages and conversation history will be deleted</li>
              <li>This process typically completes within 30 days</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Need help?</h3>
            <p className="text-muted-foreground">
              If you have questions about your data deletion request, please contact us at{" "}
              <a
                href="mailto:support@yourdomain.com"
                className="text-primary hover:underline"
              >
                support@yourdomain.com
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
