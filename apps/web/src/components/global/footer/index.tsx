"use client";

import Link from "next/link";
import GemaiLogo from "@/components/global/gemai-logo";
import { Instagram, Twitter, Linkedin, Mail, Youtube } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
    company: [
      { label: "About", href: "https://omyratech.com/pages/about/" },
      { label: "Blog", href: "https://omyratech.com/pages/blog/" },
      { label: "Contact", href: "/contact" },
    ],
    legal: [
      { label: "Privacy", href: "/privacy-policy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookies", href: "/cookies" },
      { label: "GDPR", href: "/gdpr" },
    ],
    support: [
      { label: "Help", href: "/help" },
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
    <footer className="border-t border-black/5 bg-[#F5F5F7]">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <Link href="/" className="inline-block">
              <GemaiLogo size="lg" className="h-6" />
            </Link>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-slate-500">
              Instagram automation that feels human—for creators and teams who care about every conversation.
            </p>
            <div className="mt-5 flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-black/5 text-slate-500 transition-colors hover:text-slate-900"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {(
            [
              ["Product", footerLinks.product],
              ["Company", footerLinks.company],
              ["Legal", footerLinks.legal],
              ["Support", footerLinks.support],
            ] as const
          ).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                {title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-slate-600 transition-colors hover:text-slate-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-black/5 pt-8 text-[12px] text-slate-400 sm:flex-row sm:items-center">
          <p>© {currentYear} Omyra Technologies. All rights reserved.</p>
          <a
            href="mailto:support@gemai.in"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-600"
          >
            <Mail className="h-3.5 w-3.5" />
            support@gemai.in
          </a>
        </div>
      </div>
    </footer>
  );
}
