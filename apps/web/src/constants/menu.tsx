import {
  BarChart3,
  CalendarDays,
  Inbox,
  LayoutDashboard,
  Megaphone,
  Plug,
  Settings,
  UserCheck,
  Users,
  UsersRound,
  Workflow,
  Zap,
} from "lucide-react";

export type SideBarItem = { icon: React.ReactNode; label: string; id: string; href: string };
export type SideBarGroup = { id: string; label?: string; items: SideBarItem[] };

const item = (label: string, href: string, icon: React.ReactNode): SideBarItem => ({ id: label, label, href, icon });

export const SIDEBAR_GROUPS: SideBarGroup[] = [
  {
    id: "work", label: "Work", items: [
      item("overview", "/dashboard", <LayoutDashboard className="h-4 w-4" />),
      item("inbox", "/dashboard/inbox", <Inbox className="h-4 w-4" />),
      item("leads", "/dashboard/leads", <UserCheck className="h-4 w-4" />),
      item("appointments", "/dashboard/appointments", <CalendarDays className="h-4 w-4" />),
    ],
  },
  {
    id: "automate", label: "Automate", items: [
      item("automations", "/dashboard/automations", <Zap className="h-4 w-4" />),
      item("flows", "/dashboard/flows", <Workflow className="h-4 w-4" />),
      item("campaigns", "/dashboard/broadcasts", <Megaphone className="h-4 w-4" />),
    ],
  },
  { id: "audience", label: "Audience", items: [item("contacts", "/dashboard/contacts", <Users className="h-4 w-4" />)] },
  { id: "insights", label: "Insights", items: [item("analytics", "/dashboard/analytics", <BarChart3 className="h-4 w-4" />)] },
  {
    id: "manage", label: "Manage", items: [
      item("integrations", "/dashboard/integrations", <Plug className="h-4 w-4" />),
      item("team", "/dashboard/team", <UsersRound className="h-4 w-4" />),
      item("settings", "/dashboard/settings", <Settings className="h-4 w-4" />),
    ],
  },
];

export const SIDEBAR_MENU = SIDEBAR_GROUPS.flatMap((group) => group.items);
