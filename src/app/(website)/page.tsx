import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const plans = [
    {
      name: "Starter Plan",
      description: "Perfect for getting started",
      price: "$0",
      features: [
        "100 automated responses per month",
        "Basic keyword triggers",
        "Standard response templates",
        "Email support",
        "Instagram integration",
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "Pro Plan",
      description: "Advanced features for power users",
      price: "$49",
      features: [
        "Unlimited automated responses",
        "AI-powered smart replies",
        "Advanced analytics dashboard",
        "Priority support",
        "Custom branding options",
        "Multi-account management",
      ],
      cta: "Start 14-Day Trial",
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
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-brand flex items-center justify-center font-bold text-white">
                  S
                </div>
                <span className="text-xl font-semibold text-slate-text-primary">
                  Slate AI
                </span>
              </div>
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
                ✨ Trusted by 10,000+ creators and businesses
              </div>
              
              <h1 className="text-5xl font-bold leading-tight tracking-tight text-slate-text-primary sm:text-6xl md:text-7xl lg:text-8xl">
                Your AI-Powered<br />
                <span className="bg-gradient-brand bg-clip-text text-transparent">
                  Instagram Sales
                </span>{" "}
                Assistant
              </h1>

              <p className="mt-8 text-xl text-slate-text-secondary max-w-2xl mx-auto">
                Slate AI automatically responds to DMs and comments with intelligent, 
                personalized messages that convert followers into customers—24/7.
              </p>

              <div className="mt-10 flex justify-center gap-4 flex-wrap">
                <Button
                  size="lg"
                  className="bg-gradient-brand text-white hover:shadow-glow transition-all text-base px-8 py-6 font-semibold"
                >
                  <Link href="/sign-in">Start Free Trial</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-text-tertiary text-slate-text-secondary hover:bg-slate-bg-tertiary hover:border-slate-primary transition-all text-base px-8 py-6"
                >
                  Watch Demo
                </Button>
              </div>
              
              <p className="mt-6 text-sm text-slate-text-tertiary">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </div>
            <div className="relative h-40 md:h-80 w-full mt-16 rounded-xl overflow-hidden border border-slate-primary/20">
              <Image
                src="/Ig-creators.png"
                alt="Slate AI Dashboard Preview"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container w-full py-24 md:py-32 bg-slate-bg-primary">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-slate-text-primary sm:text-5xl">
              Everything you need to scale engagement
            </h2>
            <p className="max-w-[900px] text-lg text-slate-text-secondary">
              Automate conversations, qualify leads, and drive sales—all on autopilot
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-slate-bg-secondary border border-slate-text-tertiary/10 rounded-xl p-6 hover:border-slate-primary/50 transition-all">
              <div className="h-12 w-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-text-primary mb-2">Instant Responses</h3>
              <p className="text-slate-text-secondary">
                Never miss a potential customer. Respond to every DM and comment within seconds, 24/7.
              </p>
            </div>
            
            <div className="bg-slate-bg-secondary border border-slate-text-tertiary/10 rounded-xl p-6 hover:border-slate-primary/50 transition-all">
              <div className="h-12 w-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-text-primary mb-2">Context-Aware AI</h3>
              <p className="text-slate-text-secondary">
                Our AI understands intent and provides accurate answers based on your business knowledge.
              </p>
            </div>
            
            <div className="bg-slate-bg-secondary border border-slate-text-tertiary/10 rounded-xl p-6 hover:border-slate-primary/50 transition-all">
              <div className="h-12 w-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-text-primary mb-2">Conversion Tracking</h3>
              <p className="text-slate-text-secondary">
                See exactly how many conversations turn into sales with built-in analytics.
              </p>
            </div>
            
            <div className="bg-slate-bg-secondary border border-slate-text-tertiary/10 rounded-xl p-6 hover:border-slate-primary/50 transition-all">
              <div className="h-12 w-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-text-primary mb-2">Smart Automation</h3>
              <p className="text-slate-text-secondary">
                Create sophisticated flows with triggers, conditions, and actions—no coding required.
              </p>
            </div>
            
            <div className="bg-slate-bg-secondary border border-slate-text-tertiary/10 rounded-xl p-6 hover:border-slate-primary/50 transition-all">
              <div className="h-12 w-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-text-primary mb-2">Enterprise Security</h3>
              <p className="text-slate-text-secondary">
                Bank-level encryption and compliance with Instagram&apos;s official API standards.
              </p>
            </div>
            
            <div className="bg-slate-bg-secondary border border-slate-text-tertiary/10 rounded-xl p-6 hover:border-slate-primary/50 transition-all">
              <div className="h-12 w-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                <span className="text-2xl">💎</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-text-primary mb-2">White-Glove Setup</h3>
              <p className="text-slate-text-secondary">
                Premium plans include dedicated onboarding and custom automation strategy.
              </p>
            </div>
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
                  <Button className={`w-full font-semibold ${plan.popular ? 'bg-gradient-brand text-white hover:shadow-glow' : 'bg-slate-bg-secondary border border-slate-text-tertiary hover:bg-slate-bg-primary'} transition-all`}>
                    {plan.cta}
                  </Button>
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
              Loved by creators and businesses
            </h2>
            <p className="max-w-[900px] text-lg text-slate-text-secondary">
              See how Slate AI is transforming Instagram engagement
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-bg-secondary border border-slate-text-tertiary/10 rounded-xl p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-slate-text-secondary mb-4">
                  &quot;Slate AI has completely transformed how I engage with my audience. Response time went from hours to seconds!&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-accent" />
                  <div>
                    <p className="font-semibold text-slate-text-primary">Sarah Johnson</p>
                    <p className="text-sm text-slate-text-tertiary">@sarahjfitness</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
