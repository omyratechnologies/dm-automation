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
import { Shield } from "lucide-react";

export default function GDPRCompliance() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <LegalPageHeader />

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            GDPR Compliance
          </CardTitle>
          <CardDescription>
            General Data Protection Regulation Compliance Statement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">
              Our Commitment to GDPR
            </h2>
            <p>
              Gemai is committed to protecting your personal data and complying with the General Data Protection Regulation (GDPR). We ensure that your data is processed lawfully, fairly, and transparently.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">
              1. Legal Basis for Processing
            </h2>
            <p>We process your personal data based on the following legal grounds:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Consent:</strong> You have given clear consent for us to process your personal data</li>
              <li><strong>Contract:</strong> Processing is necessary for a contract we have with you</li>
              <li><strong>Legal Obligation:</strong> Processing is necessary to comply with the law</li>
              <li><strong>Legitimate Interests:</strong> Processing is necessary for our legitimate interests</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">
              2. Your GDPR Rights
            </h2>
            <p>Under GDPR, you have the following rights:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Right to Access:</strong> Request copies of your personal data</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Right to Restrict Processing:</strong> Request that we limit the processing of your data</li>
              <li><strong>Right to Data Portability:</strong> Request transfer of your data to another organization</li>
              <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
              <li><strong>Rights Related to Automated Decision Making:</strong> Right not to be subject to automated decision-making</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">
              3. Data Protection Measures
            </h2>
            <p>We implement appropriate technical and organizational measures to ensure data security:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>End-to-end encryption for data transmission</li>
              <li>Secure data storage with encryption at rest</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Staff training on data protection practices</li>
              <li>Incident response and breach notification procedures</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">
              4. Data Retention
            </h2>
            <p>
              We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, including legal, accounting, or reporting requirements. When data is no longer needed, we securely delete or anonymize it.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">
              5. International Data Transfers
            </h2>
            <p>
              If we transfer your data outside the European Economic Area (EEA), we ensure appropriate safeguards are in place, such as Standard Contractual Clauses or adequacy decisions by the European Commission.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">
              6. Data Breach Notification
            </h2>
            <p>
              In the event of a data breach that poses a risk to your rights and freedoms, we will notify you and the relevant supervisory authority within 72 hours of becoming aware of the breach.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">
              7. How to Exercise Your Rights
            </h2>
            <p>
              To exercise any of your GDPR rights, please contact our Data Protection Officer at:
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="font-semibold">Data Protection Officer</p>
              <p className="mt-1">
                <Link
                  href="mailto:dpo@gemai.in"
                  className="text-primary hover:underline"
                >
                  dpo@gemai.in
                </Link>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                We will respond to your request within 30 days.
              </p>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">
              8. Complaints
            </h2>
            <p>
              If you believe your data protection rights have been violated, you have the right to lodge a complaint with your local supervisory authority.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Contact Information</h2>
            <p>
              For any questions regarding GDPR compliance, please contact:
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
