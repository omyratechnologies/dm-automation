import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Play, ArrowRight, Zap, Users, TrendingUp, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import GemaiLogo from "@/components/global/gemai-logo";
import Footer from "@/components/global/footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Home() {
  const plans = [
    {
      name: "Starter Plan",
      description: "Perfect for getting started",
      price: "₹0",
      features: [
        "200 automated responses per month",
        "AI-powered keyword triggers",
        "Smart response templates",
        "Email support",
        "Instagram DM automation",
        "Comment automation",
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "Pro Plan",
      description: "Best for growing businesses",
      price: "₹999",
      features: [
        "Unlimited automated responses",
        "Advanced AI smart replies",
        "Real-time analytics dashboard",
        "24/7 priority support",
        "Custom branding & workflows",
        "Multi-account management",
        "Lead qualification automation",
        "Integration with CRM systems",
      ],
      cta: "Start 14-Day Free Trial",
      popular: true,
    },
  ];
  return (
    <main>
      <section className="relative bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="relative">
          <div className="container px-4 py-8">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center">
                <GemaiLogo size="lg" className="h-10" />
              </Link>
              <nav className="hidden space-x-6 text-sm text-slate-text-secondary md:block">
                <Link href="#features" className="hover:text-slate-primary transition-colors">Features</Link>
                <Link href="#pricing" className="hover:text-slate-primary transition-colors">Pricing</Link>
                <Link href="#testimonials" className="hover:text-slate-primary transition-colors">Success Stories</Link>
              </nav>
              <Button className="bg-gradient-brand text-white font-semibold hover:shadow-glow transition-all">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>

            <div className="mx-auto mt-20 max-w-4xl text-center">
              <div className="inline-block mb-4 px-4 py-1.5 bg-slate-bg-tertiary border border-slate-primary/20 rounded-full text-sm text-slate-text-secondary">
                ✨ Trusted by 5,000+ businesses and creators worldwide
              </div>
              
              <h1 className="text-5xl font-bold leading-tight tracking-tight text-slate-text-primary sm:text-6xl md:text-7xl lg:text-8xl">
                Transform Instagram DMs into<br />
                <span className="bg-gradient-brand bg-clip-text text-transparent">
                  Revenue with AI
                </span>
              </h1>

              <p className="mt-8 text-xl text-slate-text-secondary max-w-2xl mx-auto">
                Gemai automates Instagram DMs and comments with intelligent AI responses 
                that engage customers, qualify leads, and drive sales—24/7, no manual work required.
              </p>

              <div className="mt-10 flex justify-center gap-4 flex-wrap">
                <Link href="/sign-in">
                  <Button
                    size="lg"
                    className="bg-gradient-brand text-white hover:shadow-glow transition-all text-base px-8 py-6 font-semibold"
                  >
                    Start Free - No Credit Card
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-text-tertiary text-slate-text-secondary hover:bg-slate-bg-tertiary hover:border-slate-primary transition-all text-base px-8 py-6"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>
              
              <p className="mt-6 text-sm text-slate-text-tertiary">
                Free forever plan available • No credit card required • 14-day Pro trial • Cancel anytime
              </p>
            </div>
            {/* <div className="relative h-40 md:h-80 w-full mt-16 rounded-xl overflow-hidden border border-slate-primary/20">
              <Image
                src="/Ig-creators.png"
                alt="Gemai AI-Powered Instagram Automation Dashboard"
                fill
                className="object-cover"
              />
            </div> */}
          </div>
        </div>
      </section>

      {/* Features Section - Redesigned */}
      <section id="features" className="relative w-full py-24 md:py-32 bg-gradient-to-b from-slate-bg-primary via-slate-900 to-slate-bg-primary overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse animation-delay-4000"></div>
        </div>

        <div className="container relative px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-6 text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-primary/20 to-purple-500/20 border border-slate-primary/30 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-primary"></span>
              </span>
              <span className="text-sm font-medium text-slate-text-primary">Powerful Automation Features</span>
            </div>
            
            <h2 className="text-4xl font-bold tracking-tight text-slate-text-primary sm:text-5xl md:text-6xl max-w-4xl">
              Everything You Need to
              <span className="block bg-gradient-brand bg-clip-text text-transparent mt-2">
                Dominate Instagram DMs
              </span>
            </h2>
            <p className="max-w-[900px] text-xl text-slate-text-secondary">
              Automate conversations, engage followers, qualify leads, and boost sales—all on complete autopilot
            </p>
          </div>
          
          {/* Main Feature - Spotlight */}
          <div className="max-w-6xl mx-auto mb-16">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-brand rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-slate-bg-secondary/80 backdrop-blur-sm border border-slate-text-tertiary/20 rounded-2xl p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-brand rounded-full text-xs font-bold text-white mb-6">
                      ⭐ MOST LOVED FEATURE
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-slate-text-primary mb-4">
                      AI-Powered Smart Replies
                    </h3>
                    <p className="text-lg text-slate-text-secondary mb-6">
                      Our advanced AI doesn&apos;t just respond—it understands context, learns your brand voice, and delivers personalized conversations that feel genuinely human. Watch your engagement soar while you sleep.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-slate-text-secondary">Contextual understanding of customer intent</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-slate-text-secondary">Learns and adapts to your brand voice</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-slate-text-secondary">Handles multiple languages seamlessly</span>
                      </li>
                    </ul>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-brand rounded-xl blur-2xl opacity-20"></div>
                    <div className="relative bg-slate-900 rounded-xl p-6 border border-slate-primary/30">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-text-tertiary/20">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-accent flex-shrink-0"></div>
                          <div className="flex-1">
                            <div className="bg-slate-bg-tertiary rounded-lg rounded-tl-none p-3">
                              <p className="text-sm text-slate-text-secondary">Hi! Do you ship to Mumbai?</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                          <div className="flex-1 flex justify-end">
                            <div className="bg-gradient-brand rounded-lg rounded-tr-none p-3 max-w-[80%]">
                              <p className="text-sm text-white">Yes! We ship to Mumbai with free delivery on orders over ₹499. Usually arrives in 2-3 days. 🚀</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-accent flex-shrink-0"></div>
                          <div className="flex-1">
                            <div className="bg-slate-bg-tertiary rounded-lg rounded-tl-none p-3">
                              <p className="text-sm text-slate-text-secondary">Great! What about returns?</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-slate-primary">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-slate-primary rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-primary rounded-full animate-bounce animation-delay-200"></div>
                            <div className="w-2 h-2 bg-slate-primary rounded-full animate-bounce animation-delay-400"></div>
                          </div>
                          <span className="text-xs">AI typing...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Feature 1 */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur"></div>
              <div className="relative h-full bg-slate-bg-secondary/90 backdrop-blur-sm border border-slate-text-tertiary/10 rounded-2xl p-6 hover:border-slate-primary/30 transition-all duration-300">
                <div className="relative h-14 w-14 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl opacity-20 blur-md"></div>
                  <div className="relative h-full w-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Zap className="h-7 w-7 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-text-primary mb-3 group-hover:text-transparent group-hover:bg-gradient-brand group-hover:bg-clip-text transition-all">
                  Lightning-Fast Responses
                </h3>
                <p className="text-slate-text-secondary leading-relaxed">
                  Never miss a potential customer. Gemai responds to every DM and comment in under 5 seconds, 24/7—even while you sleep.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-text-tertiary/10">
                  <div className="flex items-center gap-2 text-sm text-slate-primary">
                    <span className="font-semibold">5 sec</span>
                    <span className="text-slate-text-tertiary">avg response</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur"></div>
              <div className="relative h-full bg-slate-bg-secondary/90 backdrop-blur-sm border border-slate-text-tertiary/10 rounded-2xl p-6 hover:border-slate-primary/30 transition-all duration-300">
                <div className="relative h-14 w-14 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl opacity-20 blur-md"></div>
                  <div className="relative h-full w-full bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-text-primary mb-3 group-hover:text-transparent group-hover:bg-gradient-brand group-hover:bg-clip-text transition-all">
                  Real-Time Analytics
                </h3>
                <p className="text-slate-text-secondary leading-relaxed">
                  Track engagement rates, conversion metrics, and ROI with comprehensive analytics that show exactly how automation drives sales.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-text-tertiary/10">
                  <div className="flex items-center gap-2 text-sm text-slate-primary">
                    <span className="font-semibold">Live Dashboard</span>
                    <span className="text-slate-text-tertiary">updates</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur"></div>
              <div className="relative h-full bg-slate-bg-secondary/90 backdrop-blur-sm border border-slate-text-tertiary/10 rounded-2xl p-6 hover:border-slate-primary/30 transition-all duration-300">
                <div className="relative h-14 w-14 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl opacity-20 blur-md"></div>
                  <div className="relative h-full w-full bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-text-primary mb-3 group-hover:text-transparent group-hover:bg-gradient-brand group-hover:bg-clip-text transition-all">
                  No-Code Automation
                </h3>
                <p className="text-slate-text-secondary leading-relaxed">
                  Create sophisticated automation workflows with visual triggers, smart conditions, and custom actions—zero coding needed.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-text-tertiary/10">
                  <div className="flex items-center gap-2 text-sm text-slate-primary">
                    <span className="font-semibold">Drag & Drop</span>
                    <span className="text-slate-text-tertiary">builder</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur"></div>
              <div className="relative h-full bg-slate-bg-secondary/90 backdrop-blur-sm border border-slate-text-tertiary/10 rounded-2xl p-6 hover:border-slate-primary/30 transition-all duration-300">
                <div className="relative h-14 w-14 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl opacity-20 blur-md"></div>
                  <div className="relative h-full w-full bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🔒</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-text-primary mb-3 group-hover:text-transparent group-hover:bg-gradient-brand group-hover:bg-clip-text transition-all">
                  Enterprise Security
                </h3>
                <p className="text-slate-text-secondary leading-relaxed">
                  Bank-level encryption, GDPR compliance, and full adherence to Instagram&apos;s official Meta API standards for complete peace of mind.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-text-tertiary/10">
                  <div className="flex items-center gap-2 text-sm text-slate-primary">
                    <span className="font-semibold">100% Secure</span>
                    <span className="text-slate-text-tertiary">& compliant</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur"></div>
              <div className="relative h-full bg-slate-bg-secondary/90 backdrop-blur-sm border border-slate-text-tertiary/10 rounded-2xl p-6 hover:border-slate-primary/30 transition-all duration-300">
                <div className="relative h-14 w-14 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl opacity-20 blur-md"></div>
                  <div className="relative h-full w-full bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-text-primary mb-3 group-hover:text-transparent group-hover:bg-gradient-brand group-hover:bg-clip-text transition-all">
                  Multi-Account Support
                </h3>
                <p className="text-slate-text-secondary leading-relaxed">
                  Manage multiple Instagram business profiles from a single dashboard. Perfect for agencies and growing brands.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-text-tertiary/10">
                  <div className="flex items-center gap-2 text-sm text-slate-primary">
                    <span className="font-semibold">Unlimited</span>
                    <span className="text-slate-text-tertiary">accounts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur"></div>
              <div className="relative h-full bg-slate-bg-secondary/90 backdrop-blur-sm border border-slate-text-tertiary/10 rounded-2xl p-6 hover:border-slate-primary/30 transition-all duration-300">
                <div className="relative h-14 w-14 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl opacity-20 blur-md"></div>
                  <div className="relative h-full w-full bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">💎</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-text-primary mb-3 group-hover:text-transparent group-hover:bg-gradient-brand group-hover:bg-clip-text transition-all">
                  24/7 Priority Support
                </h3>
                <p className="text-slate-text-secondary leading-relaxed">
                  Get expert onboarding assistance, custom automation strategy sessions, and priority support to maximize your results.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-text-tertiary/10">
                  <div className="flex items-center gap-2 text-sm text-slate-primary">
                    <span className="font-semibold">Always Here</span>
                    <span className="text-slate-text-tertiary">for you</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <Link href="/sign-in">
              <Button size="lg" className="bg-gradient-brand text-white hover:shadow-glow hover:scale-105 transition-all duration-300 text-base px-10 py-6 font-semibold">
                Explore All Features
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container w-full py-24 md:py-32 bg-slate-bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-4xl font-bold tracking-tight text-slate-text-primary sm:text-5xl">
              Choose Your Plan
            </h2>
            <p className="max-w-[900px] text-lg text-slate-text-secondary">
              Start free, upgrade as you grow. No hidden fees.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 mt-12 md:grid-cols-2 md:gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`flex flex-col justify-between bg-slate-bg-tertiary border-slate-text-tertiary/10 hover:border-slate-primary/50 transition-all ${plan.popular ? 'ring-2 ring-slate-primary' : ''}`}>
                <CardHeader>
                  {plan.popular && (
                    <div className="inline-block mb-2 px-3 py-1 bg-gradient-brand rounded-full text-xs font-semibold text-white w-fit">
                      MOST POPULAR
                    </div>
                  )}
                  <CardTitle className="text-slate-text-primary text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-text-secondary">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div className="text-5xl font-bold text-slate-text-primary">
                    {plan.price}
                    <span className="text-lg font-normal text-slate-text-secondary">
                      /month
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle className="mr-3 h-5 w-5 text-slate-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-text-secondary">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/sign-in" className="w-full">
                    <Button className={`w-full font-semibold ${plan.popular ? 'bg-gradient-brand text-white hover:shadow-glow' : 'bg-slate-bg-secondary border border-slate-text-tertiary hover:bg-slate-bg-primary'} transition-all`}>
                      {plan.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="container w-full py-24 md:py-32 bg-slate-bg-primary">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-slate-text-primary sm:text-5xl">
              Trusted by Businesses Worldwide
            </h2>
            <p className="max-w-[900px] text-lg text-slate-text-secondary">
              See how Gemai is helping businesses scale their Instagram presence and boost revenue
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-bg-secondary border border-slate-text-tertiary/10 rounded-xl p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-slate-text-secondary mb-4">
                &quot;Gemai transformed our Instagram sales! We now convert 3x more followers into customers with instant, intelligent responses. Game-changer for our e-commerce business.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-accent" />
                <div>
                  <p className="font-semibold text-slate-text-primary">Priya Sharma</p>
                  <p className="text-sm text-slate-text-tertiary">@stylebypriya</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-bg-secondary border border-slate-text-tertiary/10 rounded-xl p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-slate-text-secondary mb-4">
                &quot;We were drowning in DMs. Gemai handles everything automatically while maintaining our brand voice. Response time went from 4 hours to 5 seconds!&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-accent" />
                <div>
                  <p className="font-semibold text-slate-text-primary">Rahul Verma</p>
                  <p className="text-sm text-slate-text-tertiary">@fitnesswithrahul</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-bg-secondary border border-slate-text-tertiary/10 rounded-xl p-6">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-slate-text-secondary mb-4">
                &quot;The AI is incredibly smart! It understands context and qualifies leads automatically. Gemai saved us 20+ hours per week while increasing our conversion rate by 45%.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-accent" />
                <div>
                  <p className="font-semibold text-slate-text-primary">Meera Patel</p>
                  <p className="text-sm text-slate-text-tertiary">@meera_jewelry</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container w-full py-16 bg-gradient-to-r from-slate-primary/10 to-purple-500/10 border-y border-slate-text-tertiary/10">
        <div className="container px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-slate-primary" />
              </div>
              <div className="text-4xl font-bold text-slate-text-primary mb-1">5,000+</div>
              <div className="text-sm text-slate-text-secondary">Active Users</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-8 w-8 text-slate-primary" />
              </div>
              <div className="text-4xl font-bold text-slate-text-primary mb-1">5 sec</div>
              <div className="text-sm text-slate-text-secondary">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-slate-primary" />
              </div>
              <div className="text-4xl font-bold text-slate-text-primary mb-1">3x</div>
              <div className="text-sm text-slate-text-secondary">Conversion Increase</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-slate-primary" />
              </div>
              <div className="text-4xl font-bold text-slate-text-primary mb-1">20+ hrs</div>
              <div className="text-sm text-slate-text-secondary">Saved Per Week</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container w-full py-24 md:py-32 bg-slate-bg-primary">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-slate-text-primary sm:text-5xl">
              Get Started in 3 Simple Steps
            </h2>
            <p className="max-w-[900px] text-lg text-slate-text-secondary">
              Set up your AI-powered Instagram automation in minutes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-brand flex items-center justify-center text-white text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold text-slate-text-primary mb-3">
                  Connect Instagram
                </h3>
                <p className="text-slate-text-secondary">
                  Securely link your Instagram business account with one click. We use official Meta API for complete safety.
                </p>
              </div>
              <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-slate-primary to-transparent -translate-x-1/2" />
            </div>

            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-brand flex items-center justify-center text-white text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold text-slate-text-primary mb-3">
                  Set Up Automations
                </h3>
                <p className="text-slate-text-secondary">
                  Create triggers, keywords, and responses using our no-code builder. Customize AI to match your brand voice.
                </p>
              </div>
              <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-slate-primary to-transparent -translate-x-1/2" />
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-brand flex items-center justify-center text-white text-2xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-slate-text-primary mb-3">
                Watch It Work
              </h3>
              <p className="text-slate-text-secondary">
                Activate your automations and watch Gemai handle DMs and comments 24/7. Track results in real-time analytics.
              </p>
            </div>
          </div>

          <div className="flex justify-center mt-12">
            <Link href="/sign-in">
              <Button size="lg" className="bg-gradient-brand text-white hover:shadow-glow">
                Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container w-full py-24 md:py-32 bg-slate-bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-slate-text-primary sm:text-5xl">
              Frequently Asked Questions
            </h2>
            <p className="max-w-[900px] text-lg text-slate-text-secondary">
              Everything you need to know about Gemai
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-slate-text-tertiary/20">
                <AccordionTrigger className="text-left text-slate-text-primary hover:text-slate-primary">
                  How does Gemai work?
                </AccordionTrigger>
                <AccordionContent className="text-slate-text-secondary">
                  Gemai connects to your Instagram account via Meta&apos;s official API and monitors DMs and comments 24/7. When someone messages you or comments on your posts, our AI analyzes the message, understands the intent, and responds automatically based on your configured rules and brand voice.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-slate-text-tertiary/20">
                <AccordionTrigger className="text-left text-slate-text-primary hover:text-slate-primary">
                  Is it safe to connect my Instagram account?
                </AccordionTrigger>
                <AccordionContent className="text-slate-text-secondary">
                  Absolutely! We use Instagram&apos;s official Meta Business API, which is the same technology used by major brands worldwide. Your account credentials are never stored on our servers, and we follow strict security protocols including bank-level encryption and GDPR compliance.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-slate-text-tertiary/20">
                <AccordionTrigger className="text-left text-slate-text-primary hover:text-slate-primary">
                  Can I customize the AI responses?
                </AccordionTrigger>
                <AccordionContent className="text-slate-text-secondary">
                  Yes! On the PRO plan, you can fully customize AI behavior including tone, style, and specific responses. You can train the AI on your product catalog, FAQs, and brand guidelines to ensure responses match your voice perfectly.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-slate-text-tertiary/20">
                <AccordionTrigger className="text-left text-slate-text-primary hover:text-slate-primary">
                  What&apos;s the difference between FREE and PRO?
                </AccordionTrigger>
                <AccordionContent className="text-slate-text-secondary">
                  The FREE plan includes 200 automated responses per month with basic features. The PRO plan (₹999/month) offers unlimited responses, advanced AI capabilities, real-time analytics, priority support, custom workflows, and integration options. Plus, you get a 14-day free trial to test all PRO features.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border-slate-text-tertiary/20">
                <AccordionTrigger className="text-left text-slate-text-primary hover:text-slate-primary">
                  Can I cancel anytime?
                </AccordionTrigger>
                <AccordionContent className="text-slate-text-secondary">
                  Yes, you can cancel your subscription at any time with no questions asked. Your service will remain active until the end of your billing period, and you won&apos;t be charged again.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border-slate-text-tertiary/20">
                <AccordionTrigger className="text-left text-slate-text-primary hover:text-slate-primary">
                  Do you offer refunds?
                </AccordionTrigger>
                <AccordionContent className="text-slate-text-secondary">
                  We offer a 14-day free trial for the PRO plan, so you can test all features risk-free. If you&apos;re not satisfied within the first 7 days of your paid subscription, contact our support team for a full refund.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border-slate-text-tertiary/20">
                <AccordionTrigger className="text-left text-slate-text-primary hover:text-slate-primary">
                  How fast does Gemai respond to messages?
                </AccordionTrigger>
                <AccordionContent className="text-slate-text-secondary">
                  Gemai responds within 5 seconds on average. This instant response time helps you engage customers at the perfect moment and significantly improves conversion rates compared to manual responses.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="border-slate-text-tertiary/20">
                <AccordionTrigger className="text-left text-slate-text-primary hover:text-slate-primary">
                  Can I manage multiple Instagram accounts?
                </AccordionTrigger>
                <AccordionContent className="text-slate-text-secondary">
                  Yes! The PRO plan includes multi-account management, allowing you to automate DMs and comments across multiple Instagram business profiles from a single dashboard.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container w-full py-24 md:py-32 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#667eea_1px,transparent_1px),linear-gradient(to_bottom,#667eea_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10" />
        <div className="container px-4 md:px-6 relative">
          <div className="flex flex-col items-center justify-center space-y-8 text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold tracking-tight text-slate-text-primary sm:text-5xl md:text-6xl">
              Ready to Transform Your Instagram Into a Revenue Machine?
            </h2>
            <p className="text-xl text-slate-text-secondary">
              Join 5,000+ businesses already automating their Instagram success with Gemai
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/sign-in">
                <Button
                  size="lg"
                  className="bg-gradient-brand text-white hover:shadow-glow transition-all text-base px-10 py-7 font-semibold w-full sm:w-auto"
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-text-tertiary text-slate-text-secondary hover:bg-slate-bg-tertiary hover:border-slate-primary transition-all text-base px-10 py-7 w-full sm:w-auto"
              >
                Schedule a Demo
              </Button>
            </div>
            <p className="text-sm text-slate-text-tertiary">
              ✓ No credit card required &nbsp;•&nbsp; ✓ 14-day free trial &nbsp;•&nbsp; ✓ Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
