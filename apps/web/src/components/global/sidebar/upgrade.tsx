import React from "react";
import PaymentButton from "../payment-button";
import { Button } from "@/components/ui/button";
import Loader from "../loader";

type Props = {};

const UpgradeCard = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 border border-primary/30 p-5 rounded-2xl flex flex-col gap-y-3">
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
      <div className="relative z-10">
        <span className="text-sm font-medium text-muted-foreground">
          Upgrade to{" "}
          <span className="bg-gradient-brand bg-clip-text text-transparent font-bold text-base">
            Pro Plan
          </span>
        </span>
        <p className="text-muted-foreground/80 font-light text-xs mt-2 mb-3">
          Unlock unlimited automations and AI-powered responses
        </p>
        <Button className="w-full bg-gradient-brand text-white font-semibold hover:shadow-glow hover:scale-[1.02] transition-all duration-200">
          <Loader state={false} className="text-white">
            Upgrade Now
          </Loader>
        </Button>
      </div>
    </div>
  );
};

export default UpgradeCard;
