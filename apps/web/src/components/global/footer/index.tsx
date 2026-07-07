"use client";

import Link from "next/link";
import GemaiLogo from "@/components/global/gemai-logo";
import { Instagram, Twitter, Linkedin, Mail, Youtube } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Testimonials", href: "/#testimonials" },
      { label: "FAQ", href: "/#faq" },
    ],
    company: [
      { label: "About Us", href: "https://omyratech.com/pages/about/" },
      { label: "Blog", href: "https://omyratech.com/pages/blog/" },
      { label: "Contact", href: "/contact" },
    ],
    legal: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "GDPR Compliance", href: "/gdpr" },
    ],
    support: [
      { label: "Help Center", href: "/help" },
      { label: "Documentation", href: "/docs" },
      { label: "API Reference", href: "/api" },
      { label: "Status", href: "https://status.gemai.in" },
    ],
  };

  const socialLinks = [
    { icon: Instagram, href: "https://instagram.com/gemaiapp", label: "Instagram" },
    { icon: Twitter, href: "https://twitter.com/gemaiapp", label: "Twitter" },
    { icon: Linkedin, href: "https://linkedin.com/company/gemai", label: "LinkedIn" },
    { icon: Youtube, href: "https://youtube.com/@gemaiapp", label: "YouTube" },
  ];

  return (
    <footer className="bg-slate-bg-secondary border-t border-slate-text-tertiary/10">
      <div className="container px-4 py-12 md:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link href="/" className="inline-block mb-4">
              <GemaiLogo size="lg" className="h-8" />
            </Link>
            <p className="text-sm text-slate-text-secondary mb-6 max-w-sm">
              Transform Instagram DMs into revenue with AI-powered automation. Engage, qualify, and convert—24/7.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-lg bg-slate-bg-tertiary border border-slate-text-tertiary/10 flex items-center justify-center hover:bg-slate-bg-primary hover:border-slate-primary/50 transition-all group"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5 text-slate-text-secondary group-hover:text-slate-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-slate-text-primary mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-text-secondary hover:text-slate-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-slate-text-primary mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-text-secondary hover:text-slate-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-slate-text-primary mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-text-secondary hover:text-slate-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-slate-text-primary mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-text-secondary hover:text-slate-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-slate-text-tertiary/10" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-slate-text-tertiary">
            <p>© {currentYear} Omyra Technologies. All rights reserved.</p>
            <span className="hidden md:inline">•</span>
            <a
              href="mailto:support@gemai.in"
              className="flex items-center gap-2 hover:text-slate-primary transition-colors"
            >
              <Mail className="h-4 w-4" />
              support@gemai.in
            </a>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-text-tertiary">
            <span>Made with</span>
            <span className="text-red-500">❤️</span>
            <span>in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
