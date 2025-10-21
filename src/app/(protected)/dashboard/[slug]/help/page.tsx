"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  MessageCircle, 
  Mail, 
  BookOpen, 
  Video, 
  FileText,
  ExternalLink,
  Send
} from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  const faqs = [
    {
      question: "How do I connect my Instagram account?",
      answer: "Go to Connections in the sidebar, click 'Connect Instagram', and follow the authorization steps. You'll need a business or creator Instagram account."
    },
    {
      question: "What's the difference between FREE and PRO plans?",
      answer: "FREE plan includes basic automations and message responses. PRO plan ($99/month) unlocks Smart AI features, unlimited automations, advanced analytics, and priority support."
    },
    {
      question: "How do automations work?",
      answer: "Automations trigger based on keywords in comments or DMs. When a keyword is detected, Gemai automatically responds with your configured message or uses AI to generate contextual responses."
    },
    {
      question: "Can I customize AI responses?",
      answer: "Yes! In PRO plan, you can customize AI prompts, set response tone, and train the AI on your brand voice and product information."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use enterprise-grade encryption, comply with GDPR and data protection laws, and never share your data with third parties. See our Privacy Policy for details."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "Go to Settings > Billing and click the downgrade option. Your subscription will remain active until the end of the billing period."
    },
    {
      question: "Can I export my automation data?",
      answer: "Yes, go to Settings > Privacy and click 'Download My Data' to export all your automations, analytics, and configurations."
    },
    {
      question: "What happens if I exceed the automation limit?",
      answer: "On the FREE plan, you're limited to basic automations. Upgrade to PRO for unlimited automations and advanced features."
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">Help & Support</h1>
        <p className="text-muted-foreground text-lg">
          Find answers to common questions or get in touch with our support team
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Quick answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentation & Resources
              </CardTitle>
              <CardDescription>
                Learn more about using Gemai effectively
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/privacy-policy" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Privacy Policy
                  <ExternalLink className="ml-auto h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                User Guide
                <ExternalLink className="ml-auto h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Video className="mr-2 h-4 w-4" />
                Video Tutorials
                <ExternalLink className="ml-auto h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Contact Options */}
        <div className="space-y-6">
          {/* Email Support */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5" />
                Email Support
              </CardTitle>
              <CardDescription>
                Get help from our team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Send us an email and we'll respond within 24 hours
              </p>
              <a href="mailto:support@gemai.in">
                <Button className="w-full bg-gradient-brand text-white">
                  <Send className="mr-2 h-4 w-4" />
                  Email Us
                </Button>
              </a>
              <p className="text-xs text-center text-muted-foreground">
                support@gemai.in
              </p>
            </CardContent>
          </Card>

          {/* Live Chat */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5" />
                Live Chat
              </CardTitle>
              <CardDescription>
                PRO plan feature
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Get instant support via live chat (PRO plan only)
              </p>
              <Button className="w-full" variant="outline" disabled>
                <MessageCircle className="mr-2 h-4 w-4" />
                Start Chat
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Upgrade to PRO for priority support
              </p>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="border-border bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardHeader>
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="https://gemai.in" target="_blank" className="block">
                <Button variant="ghost" className="w-full justify-start text-sm">
                  🏠 Home
                </Button>
              </Link>
              <Link href="https://gemai.in/blog" target="_blank" className="block">
                <Button variant="ghost" className="w-full justify-start text-sm">
                  📝 Blog
                </Button>
              </Link>
              <Link href="https://gemai.in/pricing" target="_blank" className="block">
                <Button variant="ghost" className="w-full justify-start text-sm">
                  💰 Pricing
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
