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

  console.log(mutationId);
  const { isPending, mutate } = useCreateAutomation(mutationId);

  return (
    <Button
      className="w-full lg:px-8 py-3 bg-gradient-brand hover:shadow-glow text-white rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
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
