"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryUser } from "@/hooks/user-queries";
import PaymentCard from "../billing/payment-card";
import { CreditCard, Calendar, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function BillingSettings() {
  const { data } = useQueryUser();
  const currentPlan = data?.data?.subscription?.plan || "FREE";

  return (
    <div className="space-y-6">
      {/* Current Subscription Info */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Current Plan</p>
              <div className="flex items-center gap-2">
                <Badge
                  variant={currentPlan === "PRO" ? "default" : "secondary"}
                  className={
                    currentPlan === "PRO"
                      ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                      : ""
                  }
                >
                  {currentPlan}
                </Badge>
                {currentPlan === "PRO" && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                )}
              </div>
            </div>
            {currentPlan === "PRO" && (
              <div className="text-right">
                <p className="text-2xl font-bold">$99</p>
                <p className="text-xs text-muted-foreground">per month</p>
              </div>
            )}
          </div>

          <Separator />

          {currentPlan === "PRO" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Next billing date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Upgrade to PRO to unlock advanced AI features and unlimited automations
            </p>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PaymentCard label="FREE" current={currentPlan} />
          <PaymentCard label="PRO" current={currentPlan} />
        </div>
      </div>
    </div>
  );
}
