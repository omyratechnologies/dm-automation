import {
  Inbox,
  Megaphone,
  Users,
  UsersRound,
  Workflow,
  UserCheck,
  LayoutDashboard,
  Zap,
  BarChart3,
  Link2,
  Settings,
} from "lucide-react";
import { v4 as uuid } from "uuid";

export type FieldProps = {
  label: string;
  id: string;
  href?: string;
};

export type SideBarItem = {
  icon: React.ReactNode;
  label: string;
  id: string;
  href: string;
};

export type SideBarGroup = {
  id: string;
  label?: string;
  items: SideBarItem[];
};

/**
 * Quiet Professional navigation structure
 * Grouped for scannability (Linear-style IA)
 */
export const SIDEBAR_GROUPS: SideBarGroup[] = [
  {
    id: uuid(),
    items: [
      {
        id: uuid(),
        label: "overview",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
      {
        id: uuid(),
        label: "inbox",
        href: "/dashboard/inbox",
        icon: <Inbox className="h-4 w-4" />,
      },
    ],
  },
  {
    id: uuid(),
    label: "Engage",
    items: [
      {
        id: uuid(),
        label: "automations",
        href: "/dashboard/automations",
        icon: <Zap className="h-4 w-4" />,
      },
      {
        id: uuid(),
        label: "flows",
        href: "/dashboard/flows",
        icon: <Workflow className="h-4 w-4" />,
      },
      {
        id: uuid(),
        label: "broadcasts",
        href: "/dashboard/broadcasts",
        icon: <Megaphone className="h-4 w-4" />,
      },
    ],
  },
  {
    id: uuid(),
    label: "Audience",
    items: [
      {
        id: uuid(),
        label: "contacts",
        href: "/dashboard/contacts",
        icon: <Users className="h-4 w-4" />,
      },
      {
        id: uuid(),
        label: "leads",
        href: "/dashboard/leads",
        icon: <UserCheck className="h-4 w-4" />,
      },
    ],
  },
  {
    id: uuid(),
    label: "Insights",
    items: [
      {
        id: uuid(),
        label: "analytics",
        href: "/dashboard/analytics",
        icon: <BarChart3 className="h-4 w-4" />,
      },
    ],
  },
  {
    id: uuid(),
    label: "Workspace",
    items: [
      {
        id: uuid(),
        label: "team",
        href: "/dashboard/team",
        icon: <UsersRound className="h-4 w-4" />,
      },
      {
        id: uuid(),
        label: "connections",
        href: "/dashboard/connections",
        icon: <Link2 className="h-4 w-4" />,
      },
      {
        id: uuid(),
        label: "settings",
        href: "/dashboard/settings",
        icon: <Settings className="h-4 w-4" />,
      },
    ],
  },
];

/** Flat list kept for backward compatibility */
export const SIDEBAR_MENU: SideBarItem[] = SIDEBAR_GROUPS.flatMap(
  (g) => g.items
);
