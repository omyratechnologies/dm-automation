"use client";

import { Button } from "@/components/ui/button";
import React, { useMemo } from "react";
import Loader from "../loader";
import { AutomationDuoToneWhite } from "@/icons";
import { useCreateAutomation } from "@/hooks/use-automations";
import { v4 } from "uuid";

type Props = {};

const CreateAutomation = (props: Props) => {
  const mutationId = useMemo(() => v4(), []);
  const { isPending, mutate } = useCreateAutomation(mutationId);

  return (
    <Button
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 font-semibold text-white transition-colors duration-200 hover:brightness-95 lg:px-8"
      onClick={() => {
        mutate({
          name: "Untitled",
          id: mutationId,
          createdAt: new Date(),
          keywords: [],
        });
      }}
    >
      <Loader state={isPending}>
        <AutomationDuoToneWhite />
        <p className="lg:inline hidden text-sm">Create Automation</p>
      </Loader>
    </Button>
  );
};

export default CreateAutomation;
