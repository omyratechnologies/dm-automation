import Link from "next/link";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import LegalPageHeader from "@/components/global/legal-page-header";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section className="space-y-3">
    <h2 className="text-xl font-semibold">{title}</h2>
    {children}
  </section>
);

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <LegalPageHeader />

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
          <CardDescription>Effective date: 18 August 2026</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 leading-7">
          <p>
            This Privacy Policy explains how Omyra Technologies
            (&quot;Gemai&quot;, &quot;we&quot;, &quot;us&quot;) collects, uses,
            shares, retains, and deletes personal data when businesses and
            creators use Gemai&apos;s Instagram automation, inbox, lead, and
            analytics services.
          </p>

          <Separator />

          <Section title="1. Our role">
            <p>
              We act as a controller for account, subscription, support, and
              product-usage data. For Instagram conversations and audience data
              processed on behalf of a connected business, we generally act as
              that business&apos;s processor or service provider. The connected
              business remains responsible for its messages, automations, and
              instructions to Gemai.
            </p>
          </Section>

          <Separator />

          <Section title="2. Data we collect">
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Account and workspace data:</strong> name, email
                address, organization, workspace, membership, role, settings,
                and support communications.
              </li>
              <li>
                <strong>Connected Instagram account data:</strong> Instagram
                user ID, username, account type, media metadata selected in the
                product, authorization status, and an encrypted access token.
              </li>
              <li>
                <strong>Instagram interaction data:</strong> Instagram-scoped
                sender IDs; available name, username, profile picture, and
                follow status; direct-message text and attachments; reactions;
                story replies; comment text and IDs; related media IDs; and
                message delivery information received through Meta APIs and
                webhooks.
              </li>
              <li>
                <strong>Automation and customer data:</strong> flows, keywords,
                reply templates, AI instructions, conversation assignments,
                lead fields, tags, segments, broadcasts, and send history.
              </li>
              <li>
                <strong>Billing data:</strong> plan, subscription status, and
                transaction references. Payment-card details are processed by
                our payment provider and are not stored by Gemai.
              </li>
              <li>
                <strong>Technical and usage data:</strong> IP address, device
                and browser information, authentication and audit events,
                errors, feature usage, and security logs.
              </li>
            </ul>
          </Section>

          <Separator />

          <Section title="3. Sources of data">
            <p>
              We receive data from you and your team, from authentication and
              payment providers, and from Meta when an authorized Instagram
              professional account connects to Gemai. Meta supplies only the
              data covered by the permissions the account grants. Instagram
              users may also provide data when they message, comment on, react
              to, mention, or otherwise interact with a connected account.
            </p>
          </Section>

          <Separator />

          <Section title="4. How we use data">
            <ul className="list-disc space-y-2 pl-6">
              <li>Connect and maintain authorized Instagram accounts.</li>
              <li>
                Receive messages, comments, story replies, and reactions and
                display them in the shared inbox.
              </li>
              <li>
                Run customer-configured automations, send replies, qualify
                leads, and provide requested human-agent support.
              </li>
              <li>
                Enforce messaging windows, consent signals, plan limits, abuse
                controls, and Instagram rate limits.
              </li>
              <li>
                Provide analytics, billing, support, security, debugging, and
                service improvement.
              </li>
              <li>Comply with law and enforce our agreements.</li>
            </ul>
            <p>
              We do not sell Meta Platform Data. We do not use Instagram data
              to build advertising profiles or for purposes unrelated to the
              features requested by the connected business.
            </p>
          </Section>

          <Separator />

          <Section title="5. AI processing">
            <p>
              When a customer enables an AI step, relevant conversation text
              and customer instructions may be sent to an AI service provider
              solely to generate the requested response or structured output.
              Customers can use non-AI templates and flows instead. We require
              service providers to protect the data they process for us.
            </p>
          </Section>

          <Separator />

          <Section title="6. When we share data">
            <p>
              We share data only as needed with hosting, database, cache,
              authentication, payment, monitoring, communications, and AI
              service providers; with Meta to operate the Instagram API; with
              a customer&apos;s authorized workspace members; in a business
              transfer subject to appropriate safeguards; or with authorities
              when legally required. Providers may use data only to deliver
              contracted services to us.
            </p>
          </Section>

          <Separator />

          <Section title="7. Retention and deletion">
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Connected-account tokens are retained only while needed to
                provide the integration. They and the account&apos;s derived
                contacts, conversations, messages, and webhook data are
                removed when you disconnect Instagram in Gemai or when Meta
                sends a valid deauthorization or deletion request.
              </li>
              <li>
                Raw Instagram webhook events are automatically removed after
                30 days. Conversation and automation data is kept while the
                workspace is active or until deletion is requested.
              </li>
              <li>
                Security, audit, tax, and transaction records may be retained
                longer where required by law or necessary to establish or
                defend legal claims.
              </li>
              <li>
                Deleted data may remain temporarily in protected backups until
                those backups expire under our normal rotation schedule. It is
                not restored to production except for disaster recovery.
              </li>
            </ul>
            <p>
              See our{" "}
              <Link href="/account-deletion" className="text-primary hover:underline">
                account and data deletion instructions
              </Link>{" "}
              for the available deletion methods.
            </p>
          </Section>

          <Separator />

          <Section title="8. Security">
            <p>
              We use transport encryption, access controls, tenant isolation,
              audit logging, signed-webhook verification, replay protection,
              and envelope encryption for Instagram access tokens. No security
              system is infallible, and we cannot guarantee absolute security.
            </p>
          </Section>

          <Separator />

          <Section title="9. International transfers">
            <p>
              Our providers may process data outside your country. Where
              required, we use recognized safeguards such as adequacy decisions
              or contractual protections for international transfers.
            </p>
          </Section>

          <Separator />

          <Section title="10. Your choices and rights">
            <p>
              Depending on your location, you may request access, correction,
              deletion, restriction, objection, or portability. You may
              disconnect Instagram in Gemai or remove Gemai through
              Instagram&apos;s website permissions at any time. You may also
              complain to your local data-protection authority.
            </p>
          </Section>

          <Separator />

          <Section title="11. Children">
            <p>
              Gemai is a business service and is not directed to children under
              13, or a higher minimum age where local law requires it. Customers
              must use Gemai and Instagram messaging in compliance with
              applicable age and privacy laws.
            </p>
          </Section>

          <Separator />

          <Section title="12. Changes and contact">
            <p>
              We may update this policy and will post the revised effective
              date here. For privacy questions or rights requests, contact{" "}
              <Link
                href="mailto:support@gemai.in"
                className="text-primary hover:underline"
              >
                support@gemai.in
              </Link>
              .
            </p>
            <p className="text-sm text-muted-foreground">
              Gemai by Omyra Technologies, India
            </p>
          </Section>
        </CardContent>
      </Card>
    </div>
  );
}
