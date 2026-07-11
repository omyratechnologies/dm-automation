import {
  AutomationDuoToneWhite,
  BarDuoToneWhite,
  HomeDuoToneWhite,
  RocketDuoToneWhite,
  SettingsDuoToneWhite,
} from "@/icons";
import {
  Inbox,
  Megaphone,
  Users,
  UsersRound,
  Workflow,
  UserCheck,
} from "lucide-react";
import { v4 as uuid } from "uuid";

export type FieldProps = {
  label: string;
  id: string;
};

type SideBarProps = {
  icon: React.ReactNode;
} & FieldProps;

export const SIDEBAR_MENU: SideBarProps[] = [
  {
    id: uuid(),
    label: "overview",
    icon: <HomeDuoToneWhite />,
  },
  {
    id: uuid(),
    label: "inbox",
    icon: <Inbox className="h-5 w-5" />,
  },
  {
    id: uuid(),
    label: "automations",
    icon: <AutomationDuoToneWhite />,
  },
  {
    id: uuid(),
    label: "flows",
    icon: <Workflow className="h-5 w-5" />,
  },
  {
    id: uuid(),
    label: "contacts",
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: uuid(),
    label: "leads",
    icon: <UserCheck className="h-5 w-5" />,
  },
  {
    id: uuid(),
    label: "broadcasts",
    icon: <Megaphone className="h-5 w-5" />,
  },
  {
    id: uuid(),
    label: "analytics",
    icon: <BarDuoToneWhite />,
  },
  {
    id: uuid(),
    label: "team",
    icon: <UsersRound className="h-5 w-5" />,
  },
  {
    id: uuid(),
    label: "connections",
    icon: <RocketDuoToneWhite />,
  },
  {
    id: uuid(),
    label: "settings",
    icon: <SettingsDuoToneWhite />,
  },
];
