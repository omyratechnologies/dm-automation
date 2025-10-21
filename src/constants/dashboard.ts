import { v4 } from "uuid";

type Props = {
  id: string;
  label: string;
  subLabel: string;
  description: string;
};

export const DASHBOARD_CARDS: Props[] = [
  {
    id: v4(),
    label: "Set-up Auto Replies",
    subLabel: "Respond to customer inquiries instantly",
    description: "Automatically send product catalogs, pricing, and links when customers ask about your offerings",
  },
  {
    id: v4(),
    label: "AI-Powered Responses",
    subLabel: "Let AI handle complex questions",
    description: "Our AI detects customer intent and provides accurate answers from your knowledge base—no training required",
  },
  {
    id: v4(),
    label: "Track Performance",
    subLabel: "Monitor your automation success",
    description: "See real-time analytics on response rates, engagement, and conversions driven by your automations",
  },
];
