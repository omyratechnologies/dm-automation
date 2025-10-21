import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { AutomationDuoToneWhite } from "@/icons";
import { usePaths } from "@/hooks/user-nav";
type Props = {};

function GoToAutomationsButton({}: Props) {
  const { pathname } = usePaths();
  return (
    <Button className="lg:px-6 py-2.5 bg-gradient-brand hover:shadow-glow text-white rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] flex items-center gap-2">
      <AutomationDuoToneWhite />
      <Link href={`${pathname}/automations`}>
        <p className="lg:inline hidden text-sm font-semibold">Go to Automations</p>
      </Link>
    </Button>
  );
}

export default GoToAutomationsButton;
