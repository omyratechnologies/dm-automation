import {
  AutomationDuoToneBlue,
  ContactsDuoToneBlue,
  HomeDuoToneBlue,
  RocketDuoToneBlue,
  SettingsDuoToneWhite,
} from "@/icons";

export const PAGE_BREAD_CRUMBS: string[] = [
  "contacts",
  "automations",
  "connections",
  "settings",
];

type Props = {
  [page in string]: React.ReactNode;
};

export const PAGE_ICON: Props = {
  AUTOMATIONS: <AutomationDuoToneBlue />,
  CONTACTS: <ContactsDuoToneBlue />,
  CONNECTIONS: <RocketDuoToneBlue />,
  INTEGRATIONS: <RocketDuoToneBlue />,
  SETTINGS: <SettingsDuoToneWhite />,
  HOME: <HomeDuoToneBlue />,
  OVERVIEW: <HomeDuoToneBlue />,
};

export const PLANS = [
  {
    name: "Starter Plan",
    description: "Perfect for getting started",
    price: "$0",
    features: [
      "100 automated responses per month",
      "Basic keyword triggers for DMs and comments",
      "Standard response templates",
      "Email support within 24 hours",
      "Instagram integration included",
    ],
    cta: "Start Free",
  },
  {
    name: "Pro Plan",
    description: "For serious creators and businesses",
    price: "$49",
    features: [
      "Unlimited automated responses",
      "AI-powered contextual replies",
      "Advanced analytics and conversion tracking",
      "Priority support (2-hour response time)",
      "Custom branding and white-label options",
      "Multi-account management",
      "Team collaboration tools",
    ],
    cta: "Start 14-Day Trial",
  },
];
