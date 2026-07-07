import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import LegalPageHeader from "@/components/global/legal-page-header";

export default function CookiePolicy() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <LegalPageHeader />

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Cookie Policy</CardTitle>
          <CardDescription>
            Last updated: {new Date().toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">
              1. What Are Cookies
            </h2>
            <p>
              Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our service.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">
              2. How We Use Cookies
            </h2>
            <p>We use cookies for the following purposes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">
              3. Types of Cookies We Use
            </h2>
            
            <div className="space-y-4 mt-2">
              <div>
                <h3 className="font-semibold">Session Cookies</h3>
                <p className="text-sm text-muted-foreground">Temporary cookies that expire when you close your browser.</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Persistent Cookies</h3>
                <p className="text-sm text-muted-foreground">Remain on your device for a set period or until you delete them.</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Third-Party Cookies</h3>
                <p className="text-sm text-muted-foreground">Set by third-party services we use, such as analytics providers.</p>
              </div>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">
              4. Managing Cookies
            </h2>
            <p>
              You can control and manage cookies in various ways. Please note that removing or blocking cookies may impact your user experience and parts of our website may no longer be fully accessible.
            </p>
            <p className="mt-2">
              Most browsers automatically accept cookies, but you can modify your browser settings to decline cookies if you prefer. Instructions for managing cookies in popular browsers:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
              <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
              <li><strong>Edge:</strong> Settings → Privacy → Cookies</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">
              5. Third-Party Services
            </h2>
            <p>We use the following third-party services that may set cookies:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Google Analytics:</strong> For website analytics and performance monitoring</li>
              <li><strong>Stripe:</strong> For payment processing (PRO plan)</li>
              <li><strong>Clerk:</strong> For authentication and user management</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">
              6. Updates to This Policy
            </h2>
            <p>
              We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Contact Us</h2>
            <p>
              If you have any questions about our Cookie Policy, please contact us at:
            </p>
            <p className="mt-2">
              <Link
                href="mailto:support@gemai.in"
                className="text-primary hover:underline"
              >
                support@gemai.in
              </Link>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Gemai by Omyra Technologies
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
