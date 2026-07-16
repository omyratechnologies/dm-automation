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
  Sparkles,
  Workflow,
  BarChart3,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import GemaiLogo from "@/components/global/gemai-logo";
import Footer from "@/components/global/footer";

export default function Home() {
  return (
    <main className="bg-white text-slate-900 antialiased">
      {/* ─── Nav ─── */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center">
            <GemaiLogo size="lg" className="h-6" />
          </Link>
          <nav className="hidden items-center gap-8 text-[13px] text-slate-600 md:flex">
            <a href="#product" className="hover:text-slate-900 transition-colors">
              Product
            </a>
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-[13px] text-slate-600">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full bg-[#5B6AF0] px-4 text-[13px] font-medium text-white hover:bg-[#4F5DE0]"
            >
              <Link href="/sign-in">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-20 text-center lg:px-8 lg:pb-24 lg:pt-28">
          <p className="mb-5 text-[13px] font-medium tracking-wide text-[#5B6AF0]">
            AI Instagram automation for creators & teams
          </p>
          <h1 className="mx-auto max-w-4xl text-[40px] font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-[68px]">
            Turn every DM into
            <br className="hidden sm:block" /> a conversation that converts.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500 sm:text-xl">
            Gemai replies to Instagram messages and comments in your voice—
            qualifies leads, routes handoffs, and keeps your inbox calm.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-[#5B6AF0] px-8 text-[15px] font-medium text-white hover:bg-[#4F5DE0]"
            >
              <Link href="/sign-in">
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-slate-200 bg-white px-8 text-[15px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <a href="#product">See how it works</a>
            </Button>
          </div>
          <p className="mt-5 text-[13px] text-slate-400">
            Free plan available · No card required · Cancel anytime
          </p>
        </div>

        {/* Product frame */}
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#0B0F19] shadow-[0_24px_80px_-12px_rgba(15,23,42,0.35)]">
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="ml-3 text-[11px] text-white/30">gemai.app / inbox</span>
            </div>
            <div className="grid grid-cols-12 min-h-[320px] md:min-h-[420px]">
              {/* Sidebar mock */}
              <div className="col-span-3 hidden border-r border-white/5 p-4 md:block">
                <div className="mb-6 text-[11px] font-medium text-white/40">Workspace</div>
                {["Overview", "Inbox", "Flows", "Contacts"].map((item, i) => (
                  <div
                    key={item}
                    className={`mb-1 rounded-md px-2.5 py-2 text-[12px] ${
                      i === 1
                        ? "bg-[#5B6AF0]/15 text-[#8B9AFF]"
                        : "text-white/50"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
              {/* Conversation list mock */}
              <div className="col-span-12 border-r border-white/5 p-3 md:col-span-4">
                <div className="mb-3 text-[11px] font-medium text-white/40 px-1">
                  Open · 12
                </div>
                {[
                  { name: "Ananya R.", preview: "Do you ship to Bangalore?", time: "2m" },
                  { name: "Rahul K.", preview: "Price for the starter kit?", time: "14m" },
                  { name: "Meera P.", preview: "Loved the new drop 🔥", time: "1h" },
                ].map((c, i) => (
                  <div
                    key={c.name}
                    className={`mb-1 flex items-center gap-3 rounded-lg px-2.5 py-2.5 ${
                      i === 0 ? "bg-white/5" : ""
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5B6AF0]/20 text-[11px] font-medium text-[#8B9AFF]">
                      {c.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[12px] font-medium text-white/90">
                          {c.name}
                        </span>
                        <span className="text-[10px] text-white/30">{c.time}</span>
                      </div>
                      <p className="truncate text-[11px] text-white/40">{c.preview}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Thread mock */}
              <div className="col-span-12 flex flex-col p-4 md:col-span-5">
                <div className="mb-4 border-b border-white/5 pb-3">
                  <p className="text-[13px] font-medium text-white/90">Ananya R.</p>
                  <p className="text-[11px] text-white/35">@ananya.creates</p>
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white/8 px-3.5 py-2.5 text-[12px] text-white/80">
                    Hi! Do you ship to Bangalore?
                  </div>
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#5B6AF0] px-3.5 py-2.5 text-[12px] text-white">
                    Yes — we ship across India. Bangalore usually arrives in 2–3 days. Free over ₹499.
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white/8 px-3.5 py-2.5 text-[12px] text-white/80">
                    Perfect, I'll order tonight 🙏
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social proof strip ─── */}
      <section className="border-y border-black/5 bg-[#F5F5F7] py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-5 text-center md:grid-cols-4 lg:px-8">
          {[
            { value: "5,000+", label: "Teams & creators" },
            { value: "<5s", label: "Avg. reply time" },
            { value: "3×", label: "More conversions" },
            { value: "20h+", label: "Saved weekly" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-semibold tracking-tight text-slate-900">
                {stat.value}
              </div>
              <div className="mt-1 text-[13px] text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Product story ─── */}
      <section id="product" className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              Built for the way you actually work.
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              One workspace for inbox, flows, and leads—calm enough for creators,
              structured enough for agencies.
            </p>
          </div>

          <div className="mt-20 space-y-24">
            {[
              {
                eyebrow: "Inbox",
                title: "Human when it matters. Automated when it doesn't.",
                body: "AI handles the routine. You take over in one click. Assignment, status, and delivery—always visible.",
                icon: Inbox,
                points: [
                  "Optimistic send with delivery status",
                  "Bot ↔ human handoff in one action",
                  "Shared team inbox with assignment",
                ],
              },
              {
                eyebrow: "Flows",
                title: "Design journeys, not just auto-replies.",
                body: "Triggers, conditions, AI steps, and tags—connected in a visual builder that stays clear under pressure.",
                icon: Workflow,
                points: [
                  "Keyword, comment, and story triggers",
                  "Branching conditions & wait steps",
                  "AI reply and lead qualification nodes",
                ],
              },
              {
                eyebrow: "Leads",
                title: "Qualify without leaving Instagram.",
                body: "Capture fields, score intent, and move prospects through a simple board your whole team can follow.",
                icon: Sparkles,
                points: [
                  "Custom lead fields",
                  "Status pipeline",
                  "Tags that sync with automations",
                ],
              },
            ].map((block, idx) => {
              const Icon = block.icon;
              return (
                <div
                  key={block.eyebrow}
                  className={`grid items-center gap-12 lg:grid-cols-2 ${
                    idx % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  <div>
                    <div className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-[#5B6AF0]">
                      <Icon className="h-4 w-4" />
                      {block.eyebrow}
                    </div>
                    <h3
                      className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
                      dangerouslySetInnerHTML={{ __html: block.title }}
                    />
                    <p className="mt-4 text-base leading-relaxed text-slate-500">
                      {block.body}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {block.points.map((p) => (
                        <li key={p} className="flex items-start gap-3 text-[15px] text-slate-600">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5B6AF0]/10">
                            <Check className="h-3 w-3 text-[#5B6AF0]" />
                          </span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-[#F5F5F7] p-6 sm:p-10">
                    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
                      <div className="mb-4 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5B6AF0]/10 text-[#5B6AF0]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{block.eyebrow}</p>
                          <p className="text-xs text-slate-400">Live in Gemai</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[1, 2, 3].map((n) => (
                          <div
                            key={n}
                            className="h-10 rounded-lg bg-slate-50 border border-slate-100"
                            style={{ width: `${100 - n * 12}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="border-t border-black/5 bg-[#F5F5F7] py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Everything you need. Nothing you don't.
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Powerful automation, presented with restraint.
            </p>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Instant replies",
                body: "Respond in seconds—day or night—without sounding robotic.",
              },
              {
                icon: MessageSquare,
                title: "AI that knows context",
                body: "Understands intent, keeps your tone, and knows when to escalate.",
              },
              {
                icon: Workflow,
                title: "Visual flow builder",
                body: "Triggers, branches, waits, and AI steps in one clear canvas.",
              },
              {
                icon: BarChart3,
                title: "Clear analytics",
                body: "See what converts. No vanity dashboards, just signal.",
              },
              {
                icon: Shield,
                title: "Official Meta API",
                body: "Built on Instagram’s platform standards—secure by design.",
              },
              {
                icon: Inbox,
                title: "Team inbox",
                body: "Assign, take over, and close—together, without chaos.",
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-black/5 bg-white p-6 transition-colors hover:border-black/10"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B6AF0]/10 text-[#5B6AF0]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-[17px] font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-500">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Live in minutes.
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Three steps. No engineering required.
            </p>
          </div>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
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
            ].map((s) => (
              <div key={s.step} className="text-center md:text-left">
                <div className="text-[13px] font-medium tracking-widest text-[#5B6AF0]">
                  {s.step}
                </div>
                <h3 className="mt-3 text-xl font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-500">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="border-t border-black/5 bg-[#F5F5F7] py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Simple pricing.
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Start free. Upgrade when you're ready.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {/* Free */}
            <div className="flex flex-col rounded-2xl border border-black/5 bg-white p-8">
              <p className="text-[13px] font-medium text-slate-500">Starter</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-slate-900">₹0</span>
                <span className="text-slate-400">/month</span>
              </div>
              <p className="mt-2 text-[15px] text-slate-500">Perfect for getting started.</p>
              <ul className="mt-8 flex-1 space-y-3">
                {[
                  "200 automated responses / month",
                  "Keyword triggers",
                  "Smart templates",
                  "Email support",
                  "DM & comment automation",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px] text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6AF0]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant="outline"
                className="mt-8 h-11 w-full rounded-full border-slate-200 font-medium"
              >
                <Link href="/sign-in">Start free</Link>
              </Button>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col rounded-2xl border border-[#5B6AF0]/30 bg-white p-8 shadow-[0_0_0_1px_rgba(91,106,240,0.08)]">
              <div className="absolute -top-3 left-8 rounded-full bg-[#5B6AF0] px-3 py-0.5 text-[11px] font-medium text-white">
                Most popular
              </div>
              <p className="text-[13px] font-medium text-slate-500">Pro</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-slate-900">₹999</span>
                <span className="text-slate-400">/month</span>
              </div>
              <p className="mt-2 text-[15px] text-slate-500">For growing brands and teams.</p>
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
                  <li key={f} className="flex items-start gap-2.5 text-[14px] text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6AF0]" />
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
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Trusted by people who ship.
            </h2>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
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
            ].map((t) => (
              <figure
                key={t.handle}
                className="flex flex-col rounded-2xl border border-black/5 bg-[#F5F5F7] p-6"
              >
                <blockquote className="flex-1 text-[15px] leading-relaxed text-slate-600">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5B6AF0]/15 text-[13px] font-medium text-[#5B6AF0]">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.handle}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="border-t border-black/5 bg-[#F5F5F7] py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-5 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Questions, answered.
            </h2>
          </div>
          <Accordion type="single" collapsible className="mt-12 w-full">
            {[
              {
                q: "How does Gemai work?",
                a: "Gemai connects via Meta’s official API, watches DMs and comments, and responds using your flows and AI rules—24/7.",
              },
              {
                q: "Is connecting Instagram safe?",
                a: "Yes. We use Instagram’s official Business API. Credentials aren’t stored on our servers, and we follow standard security practices including encryption and GDPR readiness.",
              },
              {
                q: "Can I customize AI responses?",
                a: "On Pro you can shape tone, prompts, and workflows so replies match your brand—and hand off to a human anytime.",
              },
              {
                q: "What’s the difference between Free and Pro?",
                a: "Free includes 200 automated responses per month. Pro unlocks unlimited replies, advanced AI, the flow builder, analytics, and priority support—with a 14-day trial.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel whenever you like. Access continues until the end of your billing period.",
              },
            ].map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`item-${i}`}
                className="border-black/5"
              >
                <AccordionTrigger className="text-left text-[15px] font-medium text-slate-900 hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-[15px] leading-relaxed text-slate-500">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Your inbox, on autopilot.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-500">
            Join teams and creators who let Gemai handle the noise—so they can focus on the work that matters.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-[#5B6AF0] px-8 text-[15px] font-medium text-white hover:bg-[#4F5DE0]"
            >
              <Link href="/sign-in">
                Get started free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-5 text-[13px] text-slate-400">
            No credit card · 14-day Pro trial · Cancel anytime
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
