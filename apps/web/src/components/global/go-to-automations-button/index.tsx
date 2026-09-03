import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { AutomationDuoToneWhite } from "@/icons";
import { usePaths } from "@/hooks/user-nav";
type Props = {};

function GoToAutomationsButton({}: Props) {
  const { pathname } = usePaths();
  return (
    <Button className="flex min-h-11 items-center gap-2 rounded-xl bg-gradient-brand py-2.5 font-medium text-white transition-colors duration-200 hover:brightness-95 lg:px-6">
      <AutomationDuoToneWhite />
      <Link href={`${pathname}/automations`}>
        <p className="lg:inline hidden text-sm font-semibold">Go to Automations</p>
      </Link>
    </Button>
  );
}

export default GoToAutomationsButton;
