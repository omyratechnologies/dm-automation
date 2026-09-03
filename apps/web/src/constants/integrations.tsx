import { InstagramDuoToneBlue } from "@/icons";

type Props = {
  title: string;
  icon: React.ReactNode;
  description: string;
};

export const INTEGRATION_CARDS: Props[] = [
  {
    title: "Connect Instagram",
    description:
      "Link your Instagram Business or Creator account to automate DMs, comment replies, and engage with your audience 24/7. Official Instagram API integration ensures security and compliance.",
    icon: <InstagramDuoToneBlue />,
  },
];
