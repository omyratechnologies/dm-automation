import { InstagramDuoToneBlue, SalesForceDuoToneBlue } from "@/icons";

type Props = {
  title: string;
  icon: React.ReactNode;
  description: string;
  strategy: "INSTAGRAM" | "CRM";
};

export const INTEGRATION_CARDS: Props[] = [
  {
    title: "Connect Instagram",
    description:
      "Link your Instagram Business or Creator account to automate DMs, comment replies, and engage with your audience 24/7. Official Instagram API integration ensures security and compliance.",
    icon: <InstagramDuoToneBlue />,
    strategy: "INSTAGRAM",
  },
  {
    title: "Connect Salesforce",
    description:
      "Sync your Instagram conversations directly to Salesforce CRM. Automatically create leads, track customer interactions, and measure ROI from social engagement.",
    icon: <SalesForceDuoToneBlue />,
    strategy: "CRM",
  },
];
