import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account & Data Deletion Instructions | DM Automation",
  description: "Learn how to delete your account and associated data",
};

export default function AccountDeletionPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Account & Data Deletion Instructions</h1>

        <div className="prose dark:prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-lg text-muted-foreground">
              We respect your right to control your personal data. This page explains how to delete
              your account and all associated data from our platform.
            </p>
          </section>

          {/* Delete Your Account */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-2xl font-semibold mb-4">Delete Your Account</h2>
            <p className="mb-4">To delete your account and all associated data:</p>
            <ol className="list-decimal list-inside space-y-3 ml-4">
              <li>Log in to your account</li>
              <li>Go to <strong>Settings</strong></li>
              <li>Navigate to <strong>Account Settings</strong></li>
              <li>Scroll to the bottom and click <strong>Delete Account</strong></li>
              <li>Confirm your decision by following the prompts</li>
            </ol>
          </section>

          {/* What Gets Deleted */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-2xl font-semibold mb-4">What Data Gets Deleted?</h2>
            <p className="mb-4">When you delete your account, we will permanently remove:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your profile information and account details</li>
              <li>All automation workflows and configurations</li>
              <li>Instagram/Facebook integration data and access tokens</li>
              <li>Message history and conversation data</li>
              <li>Analytics and usage data</li>
              <li>Subscription and billing information</li>
              <li>Any other personal data associated with your account</li>
            </ul>
          </section>

          {/* Facebook/Instagram Specific */}
          <section className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <h2 className="text-2xl font-semibold mb-4">
              Removing Instagram/Facebook Connection
            </h2>
            <p className="mb-4">
              If you connected your account through Facebook/Instagram and want to revoke access:
            </p>
            <ol className="list-decimal list-inside space-y-3 ml-4">
              <li>Go to your Facebook Settings</li>
              <li>
                Navigate to <strong>Apps and Websites</strong>
              </li>
              <li>Find our app in the list</li>
              <li>
                Click <strong>Remove</strong>
              </li>
            </ol>
            <p className="mt-4 text-sm">
              When you remove the app from Facebook/Instagram, Meta will automatically notify us to
              delete your data. This process is handled securely through Meta's data deletion
              callback system.
            </p>
          </section>

          {/* Timeline */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-2xl font-semibold mb-4">Deletion Timeline</h2>
            <ul className="space-y-3">
              <li>
                <strong>Immediate:</strong> Your account becomes inaccessible
              </li>
              <li>
                <strong>Within 24 hours:</strong> Active automations and integrations are
                deactivated
              </li>
              <li>
                <strong>Within 30 days:</strong> All data is permanently deleted from our systems
              </li>
              <li>
                <strong>Backup systems:</strong> Data in backups will be deleted during the next
                backup cycle (within 90 days)
              </li>
            </ul>
          </section>

          {/* Data We May Retain */}
          <section className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
            <h2 className="text-2xl font-semibold mb-4">Information We May Retain</h2>
            <p className="mb-4">
              For legal and compliance purposes, we may retain certain information:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Transaction records (for tax and accounting purposes)</li>
              <li>Records required by law or regulation</li>
              <li>Information necessary to resolve disputes or enforce agreements</li>
              <li>Aggregated, anonymized data that cannot identify you</li>
            </ul>
          </section>

          {/* Alternative Options */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-2xl font-semibold mb-4">Before You Delete</h2>
            <p className="mb-4">Consider these alternatives:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Pause automations:</strong> Temporarily disable automations without deleting
                data
              </li>
              <li>
                <strong>Disconnect integrations:</strong> Remove Instagram connection but keep your
                account
              </li>
              <li>
                <strong>Download your data:</strong> Export your data before deleting (available in
                Settings)
              </li>
              <li>
                <strong>Downgrade subscription:</strong> Switch to a free plan instead of deleting
              </li>
            </ul>
          </section>

          {/* Contact Section */}
          <section className="bg-card rounded-lg p-6 border">
            <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
            <p className="mb-4">
              If you have questions about deleting your account or data, please contact us:
            </p>
            <ul className="space-y-2">
              <li>
                <strong>Email:</strong>{" "}
                <a href="mailto:support@yourdomain.com" className="text-primary hover:underline">
                  support@yourdomain.com
                </a>
              </li>
              <li>
                <strong>Support Portal:</strong>{" "}
                <a href="/contact" className="text-primary hover:underline">
                  Contact Form
                </a>
              </li>
            </ul>
          </section>

          {/* Legal Links */}
          <section className="pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              For more information about how we handle your data:
            </p>
            <ul className="mt-2 space-y-1">
              <li>
                <a href="/privacy-policy" className="text-primary hover:underline text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/gdpr" className="text-primary hover:underline text-sm">
                  GDPR Compliance
                </a>
              </li>
              <li>
                <a href="/terms" className="text-primary hover:underline text-sm">
                  Terms of Service
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
