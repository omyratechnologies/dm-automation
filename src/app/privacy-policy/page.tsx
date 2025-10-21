import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
          <CardDescription>
            Last updated: {new Date().toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">
              1. Information We Collect
            </h2>
            <p>We collect information you provide directly to us when you:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Create an account</li>
              <li>Use our services</li>
              <li>Contact our support team</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">
              2. How We Use Your Information
            </h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Communicate with you about our services</li>
              <li>Protect against fraud and abuse</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized or unlawful
              processing, accidental loss, destruction, or damage.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Object to processing of your information</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">
              5. Changes to This Policy
            </h2>
            <p>
              We may update this privacy policy from time to time. We will
              notify you of any changes by posting the new privacy policy on
              this page.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy, please
              contact us at:
            </p>
            <p className="mt-2">
              <Link
                href="mailto:privacy@dm.ai"
                className="text-primary hover:underline"
              >
                privacy@dm.ai
              </Link>
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
