import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import React from "react";

type Props = {
  label: string;
  subLabel: string;
  description: string;
};

const DoubleGradientCard = ({ description, label, subLabel }: Props) => {
  return (
    <div className="relative border border-border bg-card backdrop-blur-sm p-6 rounded-2xl flex flex-col gap-y-16 overflow-hidden group hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
      <div className="flex flex-col z-40">
        <h2 className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors">{label}</h2>
        <p className="text-muted-foreground text-sm mt-1">{subLabel}</p>
      </div>
      <div className="flex justify-between items-center z-40 gap-x-6">
        <p className="text-muted-foreground text-sm flex-1">{description}</p>
        <Button className="rounded-full bg-gradient-brand w-11 h-11 hover:shadow-glow hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/20">
          <ArrowRight className="w-5 h-5 text-white" />
        </Button>
      </div>
      <div className="w-1/2 h-full absolute bg-gradient-to-br from-primary/10 to-transparent top-0 left-0 z-10 blur-2xl" />
      <div className="w-1/2 h-full absolute bg-gradient-to-br from-primary/5 to-transparent top-0 right-0 z-0 blur-2xl" />
    </div>
  );
};

export default DoubleGradientCard;
