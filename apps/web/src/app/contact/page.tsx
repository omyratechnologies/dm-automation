"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Phone, MapPin, Send, Clock, MessageCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import GemaiLogo from "@/components/global/gemai-logo";
import Footer from "@/components/global/footer";
import { useToast } from "@/hooks/use-toast";

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubjectChange = (value: string) => {
    setFormData({
      ...formData,
      subject: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Here you would typically send the data to your backend
    console.log("Form submitted:", formData);

    setIsSubmitting(false);
    setIsSuccess(true);

    toast({
      title: "Message sent successfully!",
      description: "We'll get back to you within 24 hours.",
    });

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSuccess(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        subject: "",
        message: "",
      });
    }, 3000);
  };

  return (
    <main className="min-h-screen bg-slate-bg-primary">
      {/* Header */}
      <header className="border-b border-slate-text-tertiary/10 bg-slate-bg-secondary/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <GemaiLogo size="lg" className="h-10" />
            </Link>
            <Link href="/">
              <Button variant="ghost" className="text-slate-text-secondary hover:text-slate-primary">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-bg-primary py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        
        <div className="container relative px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-primary/20 to-purple-500/20 border border-slate-primary/30 rounded-full mb-6">
              <MessageCircle className="h-4 w-4 text-slate-primary" />
              <span className="text-sm font-medium text-slate-text-primary">We&apos;re Here to Help</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-text-primary mb-6">
              Get in Touch with{" "}
              <span className="bg-gradient-brand bg-clip-text text-transparent">
                Our Team
              </span>
            </h1>
            
            <p className="text-xl text-slate-text-secondary max-w-2xl mx-auto">
              Have questions about Gemai? Want to learn how we can help automate your Instagram? 
              We&apos;d love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 -mt-10 relative z-10">
        <div className="container px-4">
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-bg-secondary border-slate-text-tertiary/10 shadow-xl">
                <CardContent className="p-8">
                  {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-text-primary mb-2">
                        Message Sent Successfully!
                      </h3>
                      <p className="text-slate-text-secondary">
                        Thank you for contacting us. We&apos;ll get back to you within 24 hours.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-slate-text-primary">
                            Full Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="bg-slate-bg-tertiary border-slate-text-tertiary/20 text-slate-text-primary focus:border-slate-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-slate-text-primary">
                            Email Address <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="bg-slate-bg-tertiary border-slate-text-tertiary/20 text-slate-text-primary focus:border-slate-primary"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-slate-text-primary">
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={formData.phone}
                            onChange={handleChange}
                            className="bg-slate-bg-tertiary border-slate-text-tertiary/20 text-slate-text-primary focus:border-slate-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="company" className="text-slate-text-primary">
                            Company Name
                          </Label>
                          <Input
                            id="company"
                            name="company"
                            placeholder="Your Company"
                            value={formData.company}
                            onChange={handleChange}
                            className="bg-slate-bg-tertiary border-slate-text-tertiary/20 text-slate-text-primary focus:border-slate-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-slate-text-primary">
                          Subject <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.subject}
                          onValueChange={handleSubjectChange}
                          required
                        >
                          <SelectTrigger className="bg-slate-bg-tertiary border-slate-text-tertiary/20 text-slate-text-primary">
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General Inquiry</SelectItem>
                            <SelectItem value="sales">Sales & Pricing</SelectItem>
                            <SelectItem value="support">Technical Support</SelectItem>
                            <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                            <SelectItem value="demo">Request a Demo</SelectItem>
                            <SelectItem value="feedback">Feedback & Suggestions</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-slate-text-primary">
                          Message <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="Tell us how we can help you..."
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={6}
                          className="bg-slate-bg-tertiary border-slate-text-tertiary/20 text-slate-text-primary focus:border-slate-primary resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-brand text-white hover:shadow-glow transition-all text-base py-6 font-semibold"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            Send Message
                          </>
                        )}
                      </Button>

                      <p className="text-sm text-slate-text-tertiary text-center">
                        By submitting this form, you agree to our{" "}
                        <Link href="/privacy-policy" className="text-slate-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </p>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact Information Sidebar */}
            <div className="space-y-6">
              {/* Contact Cards */}
              <Card className="bg-slate-bg-secondary border-slate-text-tertiary/10 hover:border-slate-primary/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-text-primary mb-1">Email Us</h3>
                      <p className="text-sm text-slate-text-secondary mb-2">
                        For general inquiries and support
                      </p>
                      <a
                        href="mailto:support@gemai.in"
                        className="text-slate-primary hover:underline text-sm font-medium"
                      >
                        support@gemai.in
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-bg-secondary border-slate-text-tertiary/10 hover:border-slate-primary/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-text-primary mb-1">Call Us</h3>
                      <p className="text-sm text-slate-text-secondary mb-2">
                        Monday to Friday, 9 AM - 6 PM IST
                      </p>
                      <a
                        href="tel:+919059051602"
                        className="text-slate-primary hover:underline text-sm font-medium"
                      >
                        +91 9059051602
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-bg-secondary border-slate-text-tertiary/10 hover:border-slate-primary/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-text-primary mb-1">Visit Us</h3>
                      <p className="text-sm text-slate-text-secondary">
                        Omyra Technologies Pvt. Ltd.
                        <br />
                        Sree Residance, Gajularamaram, 
                        <br />
                        Hyderabad, Telangana 500117
                        <br />
                        India
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-bg-secondary border-slate-text-tertiary/10 hover:border-slate-primary/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-text-primary mb-1">Business Hours</h3>
                      <div className="text-sm text-slate-text-secondary space-y-1">
                        <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                        <p>Saturday: 10:00 AM - 4:00 PM</p>
                        <p>Sunday: Closed</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card className="bg-gradient-to-br from-slate-primary/10 to-purple-500/10 border-slate-primary/30">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-slate-text-primary mb-3">
                    Need Immediate Help?
                  </h3>
                  <p className="text-sm text-slate-text-secondary mb-4">
                    Check out our Help Center for instant answers
                  </p>
                  <Link href="/help">
                    <Button className="w-full bg-gradient-brand text-white hover:shadow-glow">
                      Visit Help Center
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="py-16 bg-slate-bg-secondary">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-text-primary mb-4">
              Looking for Quick Answers?
            </h2>
            <p className="text-lg text-slate-text-secondary mb-8">
              Check out our FAQ section for instant answers to common questions
            </p>
            <Link href="/#faq">
              <Button variant="outline" size="lg" className="border-slate-text-tertiary hover:bg-slate-bg-tertiary">
                View FAQ
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
