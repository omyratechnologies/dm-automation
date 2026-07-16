import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Check,
  Inbox,
  MessageSquare,
  Workflow,
  BarChart3,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Footer from "@/components/global/footer";
import { Reveal } from "@/components/marketing/reveal";
import { MarketingHero } from "@/components/marketing/hero";
import { MagneticButton } from "@/components/marketing/magnetic-button";
import { ProductStage } from "@/components/marketing/product-stage";
import { ProductChapters } from "@/components/marketing/product-chapters";
import { ScrollProgress } from "@/components/marketing/scroll-progress";
import { FloatingNav } from "@/components/marketing/floating-nav";
import { BrandFilm } from "@/components/marketing/brand-film";

export default function Home() {
  return (
    <main className="bg-[#07080C] text-white antialiased overflow-x-hidden">
      <ScrollProgress />
      <FloatingNav />

      <MarketingHero />
      <BrandFilm />
      <ProductStage />

      {/* ─── Stats ─── */}
      <section className="border-y border-white/[0.06] py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-10 px-5 text-center md:grid-cols-4 lg:px-8">
          {[
            { value: "5,000+", label: "Teams & creators" },
            { value: "<5s", label: "Avg. reply time" },
            { value: "3×", label: "More conversions" },
            { value: "20h+", label: "Saved weekly" },
          ].map((stat, i) => (
            <Reveal key={stat.label} delay={i * 60}>
              <div className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {stat.value}
              </div>
              <div className="mt-2 text-[13px] text-white/40">{stat.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      <ProductChapters />

      {/* ─── Features ─── */}
      <section id="features" className="border-t border-white/[0.06] py-28 md:py-36">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <Reveal>
            <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-white/35">
              Features
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">
              Everything essential.
              <span className="text-white/40"> Nothing noisy.</span>
            </h2>
          </Reveal>

          <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Instant replies",
                body: "Respond in seconds — day or night — without sounding robotic.",
              },
              {
                icon: MessageSquare,
                title: "AI with context",
                body: "Understands intent, keeps your tone, knows when to escalate.",
              },
              {
                icon: Workflow,
                title: "Visual flows",
                body: "Triggers, branches, waits, and AI steps on one clear canvas.",
              },
              {
                icon: BarChart3,
                title: "Clear analytics",
                body: "See what converts. No vanity metrics — just signal.",
              },
              {
                icon: Shield,
                title: "Official Meta API",
                body: "Built on Instagram platform standards. Secure by design.",
              },
              {
                icon: Inbox,
                title: "Team inbox",
                body: "Assign, take over, and close — together, without chaos.",
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={i * 50}>
                  <div className="group h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]">
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B6AF0]/12 text-[#8B9AFF]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-[17px] font-semibold text-white">{f.title}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-white/45">{f.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="border-t border-white/[0.06] py-28 md:py-36">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <Reveal>
            <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-white/35">
              Get started
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Live in minutes.
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Connect Instagram",
                body: "Link your business account securely via Meta’s official API.",
              },
              {
                step: "02",
                title: "Build a flow",
                body: "Choose triggers, write replies, or let AI handle the nuance.",
              },
              {
                step: "03",
                title: "Go live",
                body: "Publish and watch conversations move while you focus elsewhere.",
              },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 80}>
                <div className="text-[13px] font-medium tracking-[0.2em] text-[#8B9AFF]">
                  {s.step}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">{s.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-white/45">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="border-t border-white/[0.06] py-28 md:py-36">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <Reveal>
            <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-white/35">
              Pricing
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Simple. Transparent.
            </h2>
          </Reveal>

          <div className="mt-16 grid gap-4 md:grid-cols-2">
            <Reveal>
              <div className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8">
                <p className="text-[13px] font-medium text-white/40">Starter</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">₹0</span>
                  <span className="text-white/35">/month</span>
                </div>
                <p className="mt-2 text-[15px] text-white/40">Perfect for getting started.</p>
                <ul className="mt-8 flex-1 space-y-3">
                  {[
                    "200 automated responses / month",
                    "Keyword triggers",
                    "Smart templates",
                    "Email support",
                    "DM & comment automation",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px] text-white/55">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#8B9AFF]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant="outline"
                  className="mt-8 h-11 w-full rounded-full border-white/15 bg-transparent font-medium text-white hover:bg-white/5 hover:text-white"
                >
                  <Link href="/sign-in">Start free</Link>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="relative flex h-full flex-col rounded-2xl border border-[#5B6AF0]/40 bg-[#5B6AF0]/[0.06] p-8">
                <div className="absolute -top-3 left-8 rounded-full bg-[#5B6AF0] px-3 py-0.5 text-[11px] font-medium text-white">
                  Most popular
                </div>
                <p className="text-[13px] font-medium text-white/40">Pro</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">₹999</span>
                  <span className="text-white/35">/month</span>
                </div>
                <p className="mt-2 text-[15px] text-white/40">For growing brands and teams.</p>
                <ul className="mt-8 flex-1 space-y-3">
                  {[
                    "Unlimited automated responses",
                    "Advanced AI replies",
                    "Visual flow builder",
                    "Analytics dashboard",
                    "Lead qualification",
                    "Priority support",
                    "Multi-account management",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px] text-white/55">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#8B9AFF]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="mt-8 h-11 w-full rounded-full bg-[#5B6AF0] font-medium text-white hover:bg-[#4F5DE0]"
                >
                  <Link href="/sign-in">Start 14-day trial</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="border-t border-white/[0.06] py-28 md:py-36">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <Reveal>
            <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-white/35">
              Voices
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Trusted by people who ship.
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {[
              {
                quote:
                  "We convert far more followers now. Instant, on-brand replies changed our DMs completely.",
                name: "Priya Sharma",
                handle: "@stylebypriya",
              },
              {
                quote:
                  "Response time went from hours to seconds. The team inbox finally feels under control.",
                name: "Rahul Verma",
                handle: "@fitnesswithrahul",
              },
              {
                quote:
                  "The AI understands context. Lead qualification runs while we focus on product.",
                name: "Meera Patel",
                handle: "@meera_jewelry",
              },
            ].map((t, i) => (
              <Reveal key={t.handle} delay={i * 70}>
                <figure className="flex h-full flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7">
                  <blockquote className="flex-1 text-[16px] leading-relaxed text-white/70">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-8 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5B6AF0]/20 text-[13px] font-medium text-[#8B9AFF]">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{t.name}</div>
                      <div className="text-xs text-white/35">{t.handle}</div>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="border-t border-white/[0.06] py-28 md:py-36">
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          <Reveal>
            <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-white/35">
              FAQ
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Questions, answered.
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <Accordion type="single" collapsible className="mt-12 w-full">
              {[
                {
                  q: "How does Gemai work?",
                  a: "Gemai connects via Meta’s official API, watches DMs and comments, and responds using your flows and AI rules — 24/7.",
                },
                {
                  q: "Is connecting Instagram safe?",
                  a: "Yes. We use Instagram’s official Business API. Credentials aren’t stored on our servers, and we follow standard security practices including encryption and GDPR readiness.",
                },
                {
                  q: "Can I customize AI responses?",
                  a: "On Pro you can shape tone, prompts, and workflows so replies match your brand — and hand off to a human anytime.",
                },
                {
                  q: "What’s the difference between Free and Pro?",
                  a: "Free includes 200 automated responses per month. Pro unlocks unlimited replies, advanced AI, the flow builder, analytics, and priority support — with a 14-day trial.",
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Yes. Cancel whenever you like. Access continues until the end of your billing period.",
                },
              ].map((item, i) => (
                <AccordionItem
                  key={item.q}
                  value={`item-${i}`}
                  className="border-white/[0.08]"
                >
                  <AccordionTrigger className="text-left text-[15px] font-medium text-white hover:no-underline hover:text-white/80">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-[15px] leading-relaxed text-white/45">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative overflow-hidden border-t border-white/[0.06] py-28 md:py-40">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[50vh] w-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5B6AF0]/15 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 text-center lg:px-8">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.1]">
              Your inbox,
              <br />
              <span className="text-white/40">on autopilot.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-lg text-white/45">
              Join teams and creators who let Gemai handle the noise — so they can focus on the work that matters.
            </p>
            <div className="mt-10">
              <MagneticButton href="/sign-in" variant="light">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </MagneticButton>
            </div>
            <p className="mt-5 text-[13px] text-white/30">
              No credit card · 14-day Pro trial · Cancel anytime
            </p>
          </Reveal>
        </div>
      </section>

      <Footer />
    </main>
  );
}
